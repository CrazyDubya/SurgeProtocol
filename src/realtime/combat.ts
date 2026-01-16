/**
 * Surge Protocol - CombatSession Durable Object
 *
 * Manages real-time combat state with WebSocket connections.
 * Each combat encounter is a separate Durable Object instance.
 */

import {
  type Combatant,
  type AttackResult,
  type InitiativeResult,
  rollInitiative,
  sortByInitiative,
  performAttack,
  applyDamage,
  getWoundStatus,
} from '../game/mechanics';

// =============================================================================
// TYPES
// =============================================================================

/** Combat state phases */
export type CombatPhase =
  | 'INITIALIZING'
  | 'ROLLING_INITIATIVE'
  | 'ACTIVE'
  | 'ROUND_END'
  | 'COMBAT_END';

/** Combat end conditions */
export type CombatEndReason =
  | 'VICTORY'      // All enemies defeated
  | 'DEFEAT'       // Player(s) defeated
  | 'ESCAPE'       // Player successfully fled
  | 'NEGOTIATION'  // Combat ended via dialogue
  | 'TIMEOUT';     // Combat timed out

/** Action types available in combat */
export type CombatActionType =
  | 'ATTACK'
  | 'MOVE'
  | 'DEFEND'
  | 'USE_ITEM'
  | 'USE_ABILITY'
  | 'DISENGAGE'
  | 'OVERWATCH'
  | 'END_TURN';

/** WebSocket message types */
export type WSMessageType =
  | 'COMBAT_STATE'
  | 'INITIATIVE_ROLLED'
  | 'TURN_START'
  | 'ACTION_RESULT'
  | 'TURN_END'
  | 'ROUND_END'
  | 'COMBAT_END'
  | 'ERROR'
  | 'PING'
  | 'PONG';

/** Inbound message from client */
export interface ClientMessage {
  type: 'ACTION' | 'PING' | 'READY';
  action?: {
    type: CombatActionType;
    targetId?: string;
    position?: { x: number; y: number };
    itemId?: string;
    abilityId?: string;
  };
}

/** Outbound message to clients */
export interface ServerMessage {
  type: WSMessageType;
  timestamp: number;
  payload: unknown;
}

/** Full combat state */
export interface CombatState {
  id: string;
  phase: CombatPhase;
  round: number;
  turnIndex: number;
  turnOrder: string[];
  combatants: Map<string, Combatant>;
  initiativeResults: InitiativeResult[];
  actionLog: ActionLogEntry[];
  startedAt: number;
  endedAt?: number;
  endReason?: CombatEndReason;
  arenaId?: string;
  environment?: {
    lighting: 'BRIGHT' | 'DIM' | 'DARK';
    weather: string;
    hazards: string[];
  };
}

/** Action log entry */
export interface ActionLogEntry {
  round: number;
  turn: number;
  actorId: string;
  action: CombatActionType;
  result: AttackResult | { success: boolean; narrative: string };
  timestamp: number;
}

/** Serializable combat state for storage */
interface StoredCombatState {
  id: string;
  phase: CombatPhase;
  round: number;
  turnIndex: number;
  turnOrder: string[];
  combatants: Array<[string, Combatant]>;
  initiativeResults: InitiativeResult[];
  actionLog: ActionLogEntry[];
  startedAt: number;
  endedAt?: number;
  endReason?: CombatEndReason;
  arenaId?: string;
  environment?: CombatState['environment'];
}

// =============================================================================
// DURABLE OBJECT
// =============================================================================

export class CombatSession {
  private state: DurableObjectState;
  private sessions: Map<WebSocket, { odrbatantId: string; ready: boolean }>;
  private combatState: CombatState | null;

  constructor(state: DurableObjectState, _env: unknown) {
    this.state = state;
    this.sessions = new Map();
    this.combatState = null;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    // HTTP endpoints
    switch (url.pathname) {
      case '/init':
        return this.handleInit(request);
      case '/state':
        return this.handleGetState();
      case '/end':
        return this.handleForceEnd(request);
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  // ---------------------------------------------------------------------------
  // HTTP Handlers
  // ---------------------------------------------------------------------------

  private async handleInit(request: Request): Promise<Response> {
    if (this.combatState && this.combatState.phase !== 'COMBAT_END') {
      return new Response(
        JSON.stringify({ error: 'Combat already in progress' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json() as {
      combatId: string;
      combatants: Combatant[];
      arenaId?: string;
      environment?: CombatState['environment'];
    };

    const combatantsMap = new Map<string, Combatant>();
    for (const c of body.combatants) {
      combatantsMap.set(c.id, c);
    }

    this.combatState = {
      id: body.combatId,
      phase: 'INITIALIZING',
      round: 0,
      turnIndex: 0,
      turnOrder: [],
      combatants: combatantsMap,
      initiativeResults: [],
      actionLog: [],
      startedAt: Date.now(),
      arenaId: body.arenaId,
      environment: body.environment,
    };

    await this.saveState();

    return new Response(
      JSON.stringify({ success: true, combatId: body.combatId }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  private async handleGetState(): Promise<Response> {
    if (!this.combatState) {
      return new Response(
        JSON.stringify({ error: 'No combat initialized' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(this.serializeState()),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  private async handleForceEnd(request: Request): Promise<Response> {
    if (!this.combatState) {
      return new Response(
        JSON.stringify({ error: 'No combat initialized' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json() as { reason: CombatEndReason };
    await this.endCombat(body.reason);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ---------------------------------------------------------------------------
  // WebSocket Handling
  // ---------------------------------------------------------------------------

  private async handleWebSocket(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const combatantId = url.searchParams.get('combatantId');

    if (!combatantId) {
      return new Response('Missing combatantId', { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    this.state.acceptWebSocket(server);
    this.sessions.set(server, { odrbatantId: combatantId, ready: false });

    // Send current state to new connection
    if (this.combatState) {
      server.send(JSON.stringify({
        type: 'COMBAT_STATE',
        timestamp: Date.now(),
        payload: this.serializeState(),
      } satisfies ServerMessage));
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return;

    try {
      const data = JSON.parse(message) as ClientMessage;
      await this.handleClientMessage(ws, data);
    } catch (error) {
      this.sendToSocket(ws, {
        type: 'ERROR',
        timestamp: Date.now(),
        payload: { message: 'Invalid message format' },
      });
    }
  }

  async webSocketClose(ws: WebSocket, _code: number, _reason: string): Promise<void> {
    this.sessions.delete(ws);
  }

  async webSocketError(ws: WebSocket, _error: unknown): Promise<void> {
    this.sessions.delete(ws);
  }

  private async handleClientMessage(ws: WebSocket, message: ClientMessage): Promise<void> {
    const session = this.sessions.get(ws);
    if (!session) return;

    switch (message.type) {
      case 'PING':
        this.sendToSocket(ws, { type: 'PONG', timestamp: Date.now(), payload: null });
        break;

      case 'READY':
        session.ready = true;
        await this.checkAllReady();
        break;

      case 'ACTION':
        if (message.action) {
          await this.handleAction(session.odrbatantId, message.action);
        }
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // Combat Logic
  // ---------------------------------------------------------------------------

  private async checkAllReady(): Promise<void> {
    if (!this.combatState || this.combatState.phase !== 'INITIALIZING') return;

    const allReady = Array.from(this.sessions.values()).every(s => s.ready);
    if (allReady && this.sessions.size > 0) {
      await this.rollInitiative();
    }
  }

  private async rollInitiative(): Promise<void> {
    if (!this.combatState) return;

    this.combatState.phase = 'ROLLING_INITIATIVE';

    // Roll initiative for all combatants
    const results: InitiativeResult[] = [];
    for (const combatant of this.combatState.combatants.values()) {
      results.push(rollInitiative(combatant));
    }

    this.combatState.initiativeResults = results;
    this.combatState.turnOrder = sortByInitiative(results, this.combatState.combatants);

    this.broadcast({
      type: 'INITIATIVE_ROLLED',
      timestamp: Date.now(),
      payload: {
        results,
        turnOrder: this.combatState.turnOrder,
      },
    });

    // Start first round
    await this.startRound();
  }

  private async startRound(): Promise<void> {
    if (!this.combatState) return;

    this.combatState.round++;
    this.combatState.turnIndex = 0;
    this.combatState.phase = 'ACTIVE';

    await this.startTurn();
  }

  private async startTurn(): Promise<void> {
    if (!this.combatState) return;

    const currentId = this.combatState.turnOrder[this.combatState.turnIndex];
    if (!currentId) return;

    const combatant = this.combatState.combatants.get(currentId);
    if (!combatant) return;

    // Skip dead/incapacitated combatants
    const status = getWoundStatus(combatant.hp, combatant.hpMax);
    if (status === 'DOWN' || status === 'DEAD') {
      await this.endTurn();
      return;
    }

    this.broadcast({
      type: 'TURN_START',
      timestamp: Date.now(),
      payload: {
        combatantId: currentId,
        round: this.combatState.round,
        turnIndex: this.combatState.turnIndex,
      },
    });

    await this.saveState();
  }

  private async handleAction(
    actorId: string,
    action: NonNullable<ClientMessage['action']>
  ): Promise<void> {
    if (!this.combatState || this.combatState.phase !== 'ACTIVE') return;

    // Verify it's this actor's turn
    const currentId = this.combatState.turnOrder[this.combatState.turnIndex];
    if (currentId !== actorId) {
      return; // Not their turn
    }

    const actor = this.combatState.combatants.get(actorId);
    if (!actor) return;

    let result: ActionLogEntry['result'];

    switch (action.type) {
      case 'ATTACK': {
        if (!action.targetId) {
          result = { success: false, narrative: 'No target specified' };
          break;
        }
        const target = this.combatState.combatants.get(action.targetId);
        if (!target) {
          result = { success: false, narrative: 'Invalid target' };
          break;
        }
        result = performAttack(actor, target);
        if (result.hit && result.damage) {
          const updatedTarget = applyDamage(target, result.damage.finalDamage);
          this.combatState.combatants.set(action.targetId, updatedTarget);
        }
        break;
      }

      case 'DEFEND':
        result = { success: true, narrative: `${actor.name} takes a defensive stance.` };
        break;

      case 'DISENGAGE':
        result = { success: true, narrative: `${actor.name} disengages from combat.` };
        break;

      case 'END_TURN':
        result = { success: true, narrative: `${actor.name} ends their turn.` };
        break;

      default:
        result = { success: false, narrative: 'Unknown action' };
    }

    // Log the action
    const logEntry: ActionLogEntry = {
      round: this.combatState.round,
      turn: this.combatState.turnIndex,
      actorId,
      action: action.type,
      result,
      timestamp: Date.now(),
    };
    this.combatState.actionLog.push(logEntry);

    this.broadcast({
      type: 'ACTION_RESULT',
      timestamp: Date.now(),
      payload: logEntry,
    });

    // Check for combat end conditions
    if (await this.checkCombatEnd()) {
      return;
    }

    // End turn after action
    await this.endTurn();
  }

  private async endTurn(): Promise<void> {
    if (!this.combatState) return;

    this.broadcast({
      type: 'TURN_END',
      timestamp: Date.now(),
      payload: {
        combatantId: this.combatState.turnOrder[this.combatState.turnIndex],
      },
    });

    this.combatState.turnIndex++;

    // Check if round is over
    if (this.combatState.turnIndex >= this.combatState.turnOrder.length) {
      await this.endRound();
    } else {
      await this.startTurn();
    }
  }

  private async endRound(): Promise<void> {
    if (!this.combatState) return;

    this.combatState.phase = 'ROUND_END';

    this.broadcast({
      type: 'ROUND_END',
      timestamp: Date.now(),
      payload: { round: this.combatState.round },
    });

    // Start next round
    await this.startRound();
  }

  private async checkCombatEnd(): Promise<boolean> {
    if (!this.combatState) return false;

    // Check if all enemies are defeated
    const playerCombatants = Array.from(this.combatState.combatants.values())
      .filter(c => !c.id.startsWith('enemy_'));
    const enemyCombatants = Array.from(this.combatState.combatants.values())
      .filter(c => c.id.startsWith('enemy_'));

    const allEnemiesDown = enemyCombatants.every(c => {
      const status = getWoundStatus(c.hp, c.hpMax);
      return status === 'DOWN' || status === 'DEAD';
    });

    const allPlayersDown = playerCombatants.every(c => {
      const status = getWoundStatus(c.hp, c.hpMax);
      return status === 'DOWN' || status === 'DEAD';
    });

    if (allEnemiesDown) {
      await this.endCombat('VICTORY');
      return true;
    }

    if (allPlayersDown) {
      await this.endCombat('DEFEAT');
      return true;
    }

    return false;
  }

  private async endCombat(reason: CombatEndReason): Promise<void> {
    if (!this.combatState) return;

    this.combatState.phase = 'COMBAT_END';
    this.combatState.endedAt = Date.now();
    this.combatState.endReason = reason;

    this.broadcast({
      type: 'COMBAT_END',
      timestamp: Date.now(),
      payload: {
        reason,
        duration: this.combatState.endedAt - this.combatState.startedAt,
        rounds: this.combatState.round,
        actionLog: this.combatState.actionLog,
      },
    });

    await this.saveState();
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  private broadcast(message: ServerMessage): void {
    const json = JSON.stringify(message);
    for (const ws of this.sessions.keys()) {
      try {
        ws.send(json);
      } catch {
        this.sessions.delete(ws);
      }
    }
  }

  private sendToSocket(ws: WebSocket, message: ServerMessage): void {
    try {
      ws.send(JSON.stringify(message));
    } catch {
      this.sessions.delete(ws);
    }
  }

  private serializeState(): StoredCombatState | null {
    if (!this.combatState) return null;

    return {
      ...this.combatState,
      combatants: Array.from(this.combatState.combatants.entries()),
    };
  }

  private deserializeState(stored: StoredCombatState): CombatState {
    return {
      ...stored,
      combatants: new Map(stored.combatants),
    };
  }

  private async saveState(): Promise<void> {
    if (!this.combatState) return;
    await this.state.storage.put('combat', this.serializeState());
  }

  private async loadState(): Promise<void> {
    const stored = await this.state.storage.get<StoredCombatState>('combat');
    if (stored) {
      this.combatState = this.deserializeState(stored);
    }
  }
}
