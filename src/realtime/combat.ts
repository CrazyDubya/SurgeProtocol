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
  findPath,
  applyEffect,
  CONSUMABLE_EFFECTS,
  ABILITY_EFFECTS,
  type TerrainMap,
  calculateCover,
  isFlanking,
  hasLineOfSight,
  COVER_TYPES,
} from '../game/mechanics';

// =============================================================================
// TYPES
// =============================================================================

import {
  type CombatPhase,
  type CombatEndReason,
  type CombatActionType,
  type WSMessageType,
  type ClientMessage,
  type ServerMessage,
  type CombatState,
  type ActionLogEntry,
  type StoredCombatState,
} from './combat-types';

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
    // Restore state from storage if not in memory
    if (!this.combatState) {
      await this.loadState();
    }

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
      case '/action':
        return this.handleActionHttp(request);
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
      terrain?: TerrainMap;
      autoStart?: boolean;
    };

    const combatantsMap = new Map<string, Combatant>();
    for (const c of body.combatants) {
      combatantsMap.set(c.id, {
        ...c,
        actionsRemaining: c.actionsRemaining ?? 1,
        movementRemaining: c.movementRemaining ?? 1,
      });
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
      overwatchTargets: new Map(),
      suppressedTargets: new Map(),
      arenaId: body.arenaId,
      environment: body.environment,
      terrain: body.terrain ?? { obstacles: [], coverPoints: [] },
    };

    await this.saveState();

    if (body.autoStart) {
      await this.rollInitiative();
    }

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
    if (body.reason) {
      await this.endCombat(body.reason);
    } else {
      await this.endCombat('DEFEAT'); // Fallback
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  private async handleActionHttp(request: Request): Promise<Response> {
    if (!this.combatState) {
      return new Response(
        JSON.stringify({ error: 'No combat initialized' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json() as {
      actorId: string;
      action: NonNullable<ClientMessage['action']>;
    };

    const result = await this.handleAction(body.actorId, body.action);

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Action failed or invalid' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const success = 'success' in result ? (result as any).success : true;

    return new Response(
      JSON.stringify({ success, data: result }),
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

  // ---------------------------------------------------------------------------
  // AI Logic
  // ---------------------------------------------------------------------------

  private async processAiTurn(actorId: string): Promise<void> {
    if (!this.combatState) return;

    // Artificial delay for pacing
    await new Promise(resolve => setTimeout(resolve, 800));

    while (this.combatState.phase === 'ACTIVE' && this.combatState.turnOrder[this.combatState.turnIndex] === actorId) {
      const actor = this.combatState.combatants.get(actorId);
      if (!actor || actor.hp <= 0) break;

      const actions = actor.actionsRemaining ?? 0;
      const movement = actor.movementRemaining ?? 0;
      console.log(`[AI:${actorId}] Resources: ${actions} actions, ${movement} move. HP: ${actor.hp}/${actor.hpMax}`);
      if (actions <= 0 && movement <= 0) break;

      // 1. Check health/healing
      const woundStatus = getWoundStatus(actor.hp, actor.hpMax);
      if ((woundStatus === 'CRITICAL' || woundStatus === 'BADLY_WOUNDED') && actions > 0) {
        const healStim = actor.items?.find(i => i.id === 'STIM_HEALTH' || i.id === 'HEALING_STIM');
        if (healStim && healStim.quantity > 0) {
          await this.handleAction(actorId, { type: 'USE_ITEM', itemId: healStim.id });
          continue;
        }
      }

      // 2. Find closest enemy
      let closestEnemy: { id: string; dist: number; hasLOS: boolean } | null = null;
      const isActorEnemy = actorId.startsWith('enemy_');

      for (const [targetId, target] of this.combatState.combatants) {
        const isTargetEnemy = targetId.startsWith('enemy_');
        if (isActorEnemy === isTargetEnemy) continue;
        if (getWoundStatus(target.hp, target.hpMax) === 'DEAD') continue;

        const dist = this.getDistance(actor, target);
        const hasLOS = hasLineOfSight(
          actor.position,
          target.position,
          (p) => this.isPositionBlocked(p, actorId)
        );

        // Priority: Visible > Closer
        if (!closestEnemy) {
          closestEnemy = { id: targetId, dist, hasLOS };
        } else {
          // If current is visible and closest is not, take current
          if (hasLOS && !closestEnemy.hasLOS) {
            closestEnemy = { id: targetId, dist, hasLOS };
          }
          // If both visible or both not visible, take closer
          else if (hasLOS === closestEnemy.hasLOS) {
            if (dist < closestEnemy.dist) {
              closestEnemy = { id: targetId, dist, hasLOS };
            }
          }
        }
      }

      if (!closestEnemy) {
        console.log(`[AI:${actorId}] No enemies found. Ending turn.`);
        await this.handleAction(actorId, { type: 'END_TURN' });
        break;
      }

      console.log(`[AI:${actorId}] Target: ${closestEnemy.id} (dist: ${closestEnemy.dist})`);

      const target = this.combatState.combatants.get(closestEnemy.id)!;
      const weapon = actor.weapon;
      let inRange = false;
      if (weapon?.ranges) {
        inRange = closestEnemy.dist <= weapon.ranges.long;
      } else {
        inRange = closestEnemy.dist <= 1.5;
      }

      // 3. Decide Action
      const canAttack = inRange && closestEnemy.hasLOS; // Require LOS to attack

      if (canAttack && actions > 0) {
        console.log(`[AI:${actorId}] Action: ATTACK ${closestEnemy.id}`);
        await this.handleAction(actorId, { type: 'ATTACK', targetId: closestEnemy.id });
      } else if (movement > 0 && (!inRange || !closestEnemy.hasLOS)) {
        const isBlocked = (p: { x: number; y: number }) => {
          // Allow pathing to the target itself, so we can stand next to it
          if (p.x === target.position.x && p.y === target.position.y) return false;

          for (const [id, c] of this.combatState!.combatants) {
            if (id === actorId) continue;
            if (c.position.x === p.x && c.position.y === p.y && c.hp > 0) return true;
          }
          return false;
        };

        const path = findPath(actor.position, target.position, isBlocked);
        if (path && path.length > 2) { // path.length > 2 means at least one step between us
          const moveLimit = 5;
          // Move to the point before the target (since target is path.length - 1)
          const moveIndex = Math.min(path.length - 2, moveLimit);
          const newPos = path[moveIndex];
          if (!newPos) break;
          console.log(`[AI:${actorId}] Action: MOVE to ${newPos.x},${newPos.y}`);
          await this.handleAction(actorId, { type: 'MOVE', position: newPos });
        } else {
          // No path or already adjacent but out of actions/range?
          if (actions > 0) {
            console.log(`[AI:${actorId}] Action: DEFEND (None/Blocked)`);
            await this.handleAction(actorId, { type: 'DEFEND' });
          } else {
            console.log(`[AI:${actorId}] Action: END_TURN (None/Blocked)`);
            await this.handleAction(actorId, { type: 'END_TURN' });
          }
          break;
        }
      } else {
        // In range but no actions, or no movement left
        if (actions > 0) {
          console.log(`[AI:${actorId}] Action: OVERWATCH/DEFEND`);
          await this.handleAction(actorId, { type: 'OVERWATCH' });
        } else {
          console.log(`[AI:${actorId}] Action: END_TURN (Out of resources)`);
          await this.handleAction(actorId, { type: 'END_TURN' });
        }
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 600));
    }

    // Final check: if we are still active and it's our turn, but we used our actions, end turn
    const checkState = this.combatState;
    if (checkState && checkState.phase === 'ACTIVE' && checkState.turnOrder[checkState.turnIndex] === actorId) {
      const finalActor = checkState.combatants.get(actorId);
      if (finalActor && (finalActor.actionsRemaining ?? 0) <= 0) {
        await this.handleAction(actorId, { type: 'END_TURN' });
      }
    }
  }

  private getDistance(a: Combatant, b: Combatant): number {
    // Chebyshev distance (chessboard distance) for grid
    return Math.max(Math.abs(a.position.x - b.position.x), Math.abs(a.position.y - b.position.y));
  }

  private isPositionBlocked(p: { x: number; y: number }, excludeActorId?: string): boolean {
    if (!this.combatState) return false;

    // Check obstacles
    if (this.combatState.terrain.obstacles.some(o => o.x === p.x && o.y === p.y)) {
      return true;
    }

    // Check combatants
    for (const [id, c] of this.combatState.combatants) {
      if (excludeActorId && id === excludeActorId) continue;
      if (c.position.x === p.x && c.position.y === p.y && c.hp > 0) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Combat Logic overrides/updates
  // ---------------------------------------------------------------------------

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

    // Reset action economy
    combatant.actionsRemaining = 1;
    combatant.movementRemaining = 1;
    this.combatState.combatants.set(currentId, combatant);

    // 1. Process Status Effects (Bleed, Regen, etc.)
    await this.processTurnStart(combatant);

    // Re-check status after effects (might have died from bleed)
    const postEffectStatus = getWoundStatus(combatant.hp, combatant.hpMax);
    if (postEffectStatus === 'DOWN' || postEffectStatus === 'DEAD') {
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

    // Trigger AI if applicable
    if (currentId.startsWith('enemy_')) {
      // Run in background without blocking
      this.state.waitUntil(this.processAiTurn(currentId));
    }
  }

  private async processTurnStart(combatant: Combatant): Promise<void> {
    // Logic for processing status effects at the start of a turn (e.g., DOT damage)
    // Placeholder for FUTURE implementation of specific condition logic
    if (combatant.hp <= 0) return;

    await this.saveState();
  }

  private async handleAction(
    actorId: string,
    action: NonNullable<ClientMessage['action']>
  ): Promise<ActionLogEntry['result'] | null> {
    if (!this.combatState || this.combatState.phase !== 'ACTIVE') {
      return null;
    }

    // Verify it's this actor's turn
    const currentId = this.combatState.turnOrder[this.combatState.turnIndex];
    if (currentId !== actorId) {
      return null; // Not their turn
    }

    const actor = this.combatState.combatants.get(actorId);
    if (!actor) return null;

    // Resource checks
    if (action.type === 'MOVE' && (actor.movementRemaining ?? 0) <= 0) {
      return { success: false, narrative: 'No movement remaining.' };
    }
    const isStandardAction = ['ATTACK', 'USE_ITEM', 'USE_ABILITY', 'DEFEND', 'OVERWATCH', 'SUPPRESSIVE_FIRE'].includes(action.type);
    if (isStandardAction && (actor.actionsRemaining ?? 0) <= 0) {
      return { success: false, narrative: 'No actions remaining.' };
    }

    let result: ActionLogEntry['result'];

    switch (action.type) {
      case 'MOVE': {
        if (!action.position) {
          result = { success: false, narrative: 'No destination specified' };
          break;
        }

        // Define blocking function (other combatants are blocks)
        const isBlocked = (p: { x: number; y: number }) => {
          for (const [id, c] of this.combatState!.combatants) {
            if (id === actorId) continue;
            if (c.position.x === p.x && c.position.y === p.y && c.hp > 0) return true;
          }
          return false;
        };

        const path = findPath(actor.position, action.position, isBlocked);

        if (!path) {
          result = { success: false, narrative: 'No valid path to destination.' };
          break;
        }

        // Validate distance (max 10 squares for now)
        const moveLimit = 10;
        if (path.length - 1 > moveLimit) {
          result = { success: false, narrative: 'Destination too far.' };
          break;
        }

        // Update position
        actor.position = action.position;
        this.combatState.combatants.set(actorId, actor);

        result = {
          success: true,
          narrative: `${actor.name} moves to position ${action.position.x},${action.position.y}.`
        };
        // Deduct movement
        actor.movementRemaining = (actor.movementRemaining ?? 1) - 1;
        break;
      }

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

        // Check if target has Overwatch set against this attacker
        for (const [overwatcherId, overwatchDir] of this.combatState.overwatchTargets) {
          if (overwatcherId === actorId) continue; // Can't overwatch yourself
          const overwatcher = this.combatState.combatants.get(overwatcherId);
          if (!overwatcher || overwatcher.hp <= 0) continue;
          // Overwatch triggers on any enemy action (simplified: checks any non-self overwatcher)
          // '*' means overwatch against any enemy action
          if (overwatchDir === '*' || overwatchDir === actorId) {
            const overwatchResult = performAttack(overwatcher, actor);
            if (overwatchResult.hit && overwatchResult.damage) {
              const updatedActor = applyDamage(actor, overwatchResult.damage.finalDamage);
              this.combatState.combatants.set(actorId, updatedActor);
            }
            // Log overwatch reaction
            this.combatState.actionLog.push({
              round: this.combatState.round,
              turn: this.combatState.turnIndex,
              actorId: overwatcherId,
              action: 'OVERWATCH',
              result: overwatchResult,
              timestamp: Date.now(),
            });
            this.broadcast({
              type: 'ACTION_RESULT',
              timestamp: Date.now(),
              payload: {
                round: this.combatState.round,
                actorId: overwatcherId,
                action: 'OVERWATCH',
                result: overwatchResult,
                narrative: `${overwatcher.name} fires from overwatch!`,
              },
            });
            // Consume overwatch
            this.combatState.overwatchTargets.delete(overwatcherId);
          }
        }

        // Check if attacker is suppressed (accuracy penalty)
        const suppressionPenalty = this.combatState.suppressedTargets.get(actorId) ?? 0;
        // Apply suppression: we reduce hit chance by temporarily lowering attacker precision
        // We clone the actor to avoid permanent stat changes
        let effectiveActor = actor;
        if (suppressionPenalty > 0) {
          effectiveActor = {
            ...actor,
            attributes: { ...actor.attributes, PRC: Math.max(1, actor.attributes.PRC - suppressionPenalty) },
          };
          // Clear suppression after it takes effect
          this.combatState.suppressedTargets.delete(actorId);
        }

        // Check Line of Sight
        const hasLOS = hasLineOfSight(
          effectiveActor.position,
          target.position,
          (p) => this.isPositionBlocked(p, actorId)
        );

        if (!hasLOS) {
          result = { success: false, narrative: 'No line of sight to target.' };
          break;
        }

        // Calculate distance for ranged attacks
        const dist = this.getDistance(effectiveActor, target);

        // Calculate Tactical Modifiers
        const cover = calculateCover(target.position, effectiveActor.position, this.combatState.terrain);
        const flanking = isFlanking(effectiveActor.position, target.position, target.facing);

        result = performAttack(effectiveActor, target, dist, {
          cover,
          isFlanking: flanking
        });

        if (result.hit && result.damage) {
          const updatedTarget = applyDamage(target, result.damage.finalDamage);
          this.combatState.combatants.set(action.targetId, updatedTarget);
        }
        break;
      }

      case 'USE_ITEM': {
        if (!action.itemId) {
          result = { success: false, narrative: 'No item specified.' };
          break;
        }

        const effect = CONSUMABLE_EFFECTS[action.itemId];
        if (!effect) {
          result = { success: false, narrative: `Item effect for ${action.itemId} not found.` };
          break;
        }

        // Apply to self if no target specified
        const itemTargetId = action.targetId ?? actorId;
        const itemTarget = this.combatState.combatants.get(itemTargetId);
        if (!itemTarget) {
          result = { success: false, narrative: 'Invalid item target.' };
          break;
        }

        const { updatedTarget, result: effectResult } = applyEffect(itemTarget, effect);
        this.combatState.combatants.set(itemTargetId, updatedTarget);
        result = effectResult;
        break;
      }

      case 'USE_ABILITY': {
        if (!action.abilityId) {
          result = { success: false, narrative: 'No ability specified.' };
          break;
        }

        const abilityEffect = ABILITY_EFFECTS[action.abilityId];
        if (!abilityEffect) {
          result = { success: false, narrative: `Ability effect for ${action.abilityId} not found.` };
          break;
        }

        // Apply to self if no target specified
        const abilityTargetId = action.targetId ?? actorId;
        const abilityTarget = this.combatState.combatants.get(abilityTargetId);
        if (!abilityTarget) {
          result = { success: false, narrative: 'Invalid ability target.' };
          break;
        }

        const { updatedTarget, result: abilityEffectResult } = applyEffect(abilityTarget, abilityEffect);
        this.combatState.combatants.set(abilityTargetId, updatedTarget);
        result = abilityEffectResult;
        break;
      }

      case 'DEFEND':
        result = { success: true, narrative: `${actor.name} takes a defensive stance.` };
        break;

      case 'OVERWATCH': {
        // Actor enters overwatch: will react-fire at the first enemy who acts
        const owTarget = action.targetId ?? '*'; // '*' = any enemy, or specific target
        this.combatState.overwatchTargets.set(actorId, owTarget);
        result = {
          success: true,
          narrative: owTarget === '*'
            ? `${actor.name} enters overwatch, covering all approaches.`
            : `${actor.name} sets up overwatch on a specific target.`,
        };
        break;
      }

      case 'SUPPRESSIVE_FIRE': {
        if (!action.targetId) {
          result = { success: false, narrative: 'No target specified for suppressive fire.' };
          break;
        }
        const sfTarget = this.combatState.combatants.get(action.targetId);
        if (!sfTarget) {
          result = { success: false, narrative: 'Invalid suppressive fire target.' };
          break;
        }
        // Apply suppression: target gets -3 PRC penalty on their next attack
        const penalty = 3;
        const existing = this.combatState.suppressedTargets.get(action.targetId) ?? 0;
        this.combatState.suppressedTargets.set(action.targetId, existing + penalty);
        result = {
          success: true,
          narrative: `${actor.name} lays down suppressive fire on ${sfTarget.name}, hindering their accuracy!`,
        };
        break;
      }

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
      return result;
    }

    // Deduct standard action
    if (isStandardAction) {
      actor.actionsRemaining = (actor.actionsRemaining ?? 1) - 1;
    }

    // Check for combat end conditions
    if (await this.checkCombatEnd()) {
      return result;
    }

    // Explicit end turn or no resources left
    const noResourcesLeft = (actor.actionsRemaining ?? 0) <= 0 && (actor.movementRemaining ?? 0) <= 0;

    if (action.type === 'END_TURN' || noResourcesLeft) {
      await this.processTurnEnd(actorId);
      await this.endTurn();
    } else {
      // Still has actions/movement, save state and wait for next action
      await this.broadcast({
        type: 'TURN_START', // Notify that it's still their turn
        timestamp: Date.now(),
        payload: {
          combatantId: actorId,
          round: this.combatState.round,
          turnIndex: this.combatState.turnIndex,
          remainingActions: actor.actionsRemaining,
          remainingMovement: actor.movementRemaining,
        },
      });
      await this.saveState();
    }

    return result;
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

  private async processTurnEnd(combatantId: string): Promise<void> {
    if (!this.combatState) return;

    const combatant = this.combatState.combatants.get(combatantId);
    if (!combatant) return;

    // 1. Decrement condition durations (placeholder if implementation exists)
    // 2. Clear temporary modifiers

    // Clear suppressed status if it was set this turn or has expired
    if (this.combatState.suppressedTargets.has(combatantId)) {
      // Simple logic: suppression lasts exactly one round
      // In a more complex system, we'd check timestamps/turns
      this.combatState.suppressedTargets.delete(combatantId);
    }

    // Clear defending status
    const defenseIndex = combatant.conditions.indexOf('DEFENDING');
    if (defenseIndex !== -1) {
      combatant.conditions.splice(defenseIndex, 1);
    }

    await this.saveState();
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
      overwatchTargets: Array.from(this.combatState.overwatchTargets.entries()),
      suppressedTargets: Array.from(this.combatState.suppressedTargets.entries()),
    };
  }

  private deserializeState(stored: StoredCombatState): CombatState {
    return {
      ...stored,
      combatants: new Map(stored.combatants),
      overwatchTargets: new Map(stored.overwatchTargets),
      suppressedTargets: new Map(stored.suppressedTargets),
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

