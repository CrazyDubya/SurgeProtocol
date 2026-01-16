/**
 * Surge Protocol - WarTheater Durable Object
 *
 * Manages faction war state, contributions, and real-time updates.
 * Handles war phases: ESCALATION → CONFLICT → RESOLUTION
 */

import { DurableObject } from 'cloudflare:workers';

// =============================================================================
// TYPES
// =============================================================================

export type WarPhase = 'ESCALATION' | 'CONFLICT' | 'RESOLUTION' | 'ENDED';

export type ObjectiveType =
  | 'TERRITORY_CONTROL'
  | 'RESOURCE_CAPTURE'
  | 'ASSASSINATION'
  | 'SABOTAGE'
  | 'DEFENSE'
  | 'EXTRACTION';

export interface WarObjective {
  id: string;
  type: ObjectiveType;
  name: string;
  description: string;
  targetScore: number;
  currentScore: number;
  controllingFaction: string | null;
  location: string;
  isComplete: boolean;
  completedBy: string | null;
  completedAt: string | null;
}

export interface FactionWarState {
  factionId: string;
  factionName: string;
  totalScore: number;
  objectivesCompleted: number;
  contributions: number;
  participants: Set<string>;
  resources: {
    credits: number;
    supplies: number;
    intel: number;
  };
}

export interface WarContribution {
  id: string;
  characterId: string;
  characterName: string;
  factionId: string;
  contributionType: 'COMBAT' | 'SUPPLY' | 'INTEL' | 'SABOTAGE' | 'MISSION';
  value: number;
  objectiveId?: string;
  timestamp: string;
}

export interface WarState {
  warId: string;
  name: string;
  phase: WarPhase;
  startedAt: string;
  phaseStartedAt: string;
  endedAt: string | null;

  // Combatants
  attackerFaction: FactionWarState;
  defenderFaction: FactionWarState;

  // Objectives
  objectives: Map<string, WarObjective>;

  // History
  contributions: WarContribution[];
  phaseHistory: Array<{
    phase: WarPhase;
    startedAt: string;
    endedAt: string;
    attackerScore: number;
    defenderScore: number;
  }>;

  // Configuration
  config: {
    escalationDurationMinutes: number;
    conflictDurationMinutes: number;
    resolutionDurationMinutes: number;
    victoryThreshold: number;
    maxObjectives: number;
  };
}

// WebSocket message types
type WarMessage =
  | { type: 'WAR_STATE'; state: SerializedWarState }
  | { type: 'CONTRIBUTION'; contribution: WarContribution }
  | { type: 'OBJECTIVE_UPDATE'; objective: WarObjective }
  | { type: 'PHASE_CHANGE'; phase: WarPhase; previousPhase: WarPhase }
  | { type: 'WAR_ENDED'; winner: string; finalScores: { attacker: number; defender: number } }
  | { type: 'ERROR'; code: string; message: string };

interface SerializedWarState extends Omit<WarState, 'objectives' | 'attackerFaction' | 'defenderFaction'> {
  objectives: WarObjective[];
  attackerFaction: Omit<FactionWarState, 'participants'> & { participants: string[] };
  defenderFaction: Omit<FactionWarState, 'participants'> & { participants: string[] };
}

// =============================================================================
// DURABLE OBJECT
// =============================================================================

export class WarTheater extends DurableObject {
  private warState: WarState | null = null;
  private sessions: Map<WebSocket, { characterId: string; factionId: string }> = new Map();

  async fetch(request: Request): Promise<Response> {
    // Restore state if not in memory
    if (!this.warState) {
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
      case '/contribute':
        return this.handleContribute(request);
      case '/advance-phase':
        return this.handleAdvancePhase();
      case '/complete-objective':
        return this.handleCompleteObjective(request);
      case '/end':
        return this.handleEndWar(request);
      default:
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
    }
  }

  // ===========================================================================
  // WEBSOCKET HANDLING
  // ===========================================================================

  private handleWebSocket(request: Request): Response {
    const url = new URL(request.url);
    const characterId = url.searchParams.get('characterId');
    const factionId = url.searchParams.get('factionId');

    if (!characterId || !factionId) {
      return new Response('Missing characterId or factionId', { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    this.ctx.acceptWebSocket(server);
    this.sessions.set(server, { characterId, factionId });

    // Send current state
    if (this.warState) {
      server.send(JSON.stringify({
        type: 'WAR_STATE',
        state: this.serializeState(),
      }));

      // Add participant to faction
      if (factionId === this.warState.attackerFaction.factionId) {
        this.warState.attackerFaction.participants.add(characterId);
      } else if (factionId === this.warState.defenderFaction.factionId) {
        this.warState.defenderFaction.participants.add(characterId);
      }
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    try {
      const data = JSON.parse(message as string);
      this.handleClientMessage(ws, data);
    } catch {
      ws.send(JSON.stringify({
        type: 'ERROR',
        code: 'INVALID_MESSAGE',
        message: 'Failed to parse message',
      }));
    }
  }

  webSocketClose(ws: WebSocket): void {
    const session = this.sessions.get(ws);
    if (session && this.warState) {
      // Remove participant
      this.warState.attackerFaction.participants.delete(session.characterId);
      this.warState.defenderFaction.participants.delete(session.characterId);
    }
    this.sessions.delete(ws);
  }

  webSocketError(ws: WebSocket): void {
    this.sessions.delete(ws);
  }

  private handleClientMessage(
    ws: WebSocket,
    data: { action: string; [key: string]: unknown }
  ): void {
    const session = this.sessions.get(ws);
    if (!session) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        code: 'NO_SESSION',
        message: 'Session not found',
      }));
      return;
    }

    switch (data.action) {
      case 'CONTRIBUTE':
        this.processContribution(ws, session, data);
        break;
      case 'GET_STATE':
        ws.send(JSON.stringify({
          type: 'WAR_STATE',
          state: this.serializeState(),
        }));
        break;
      default:
        ws.send(JSON.stringify({
          type: 'ERROR',
          code: 'UNKNOWN_ACTION',
          message: `Unknown action: ${data.action}`,
        }));
    }
  }

  private broadcast(message: WarMessage, excludeFaction?: string): void {
    const messageStr = JSON.stringify(message);
    for (const [ws, session] of this.sessions) {
      if (excludeFaction && session.factionId === excludeFaction) continue;
      try {
        ws.send(messageStr);
      } catch {
        this.sessions.delete(ws);
      }
    }
  }

  // ===========================================================================
  // HTTP HANDLERS
  // ===========================================================================

  private async handleInit(request: Request): Promise<Response> {
    if (this.warState) {
      return new Response(JSON.stringify({ error: 'War already initialized' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as {
      warId: string;
      name: string;
      attackerFactionId: string;
      attackerFactionName: string;
      defenderFactionId: string;
      defenderFactionName: string;
      objectives?: Omit<WarObjective, 'currentScore' | 'isComplete' | 'completedBy' | 'completedAt' | 'controllingFaction'>[];
      config?: Partial<WarState['config']>;
    };

    const now = new Date().toISOString();

    this.warState = {
      warId: body.warId,
      name: body.name,
      phase: 'ESCALATION',
      startedAt: now,
      phaseStartedAt: now,
      endedAt: null,

      attackerFaction: {
        factionId: body.attackerFactionId,
        factionName: body.attackerFactionName,
        totalScore: 0,
        objectivesCompleted: 0,
        contributions: 0,
        participants: new Set(),
        resources: { credits: 0, supplies: 0, intel: 0 },
      },

      defenderFaction: {
        factionId: body.defenderFactionId,
        factionName: body.defenderFactionName,
        totalScore: 0,
        objectivesCompleted: 0,
        contributions: 0,
        participants: new Set(),
        resources: { credits: 0, supplies: 0, intel: 0 },
      },

      objectives: new Map(
        (body.objectives ?? []).map((obj) => [
          obj.id,
          {
            ...obj,
            currentScore: 0,
            isComplete: false,
            completedBy: null,
            completedAt: null,
            controllingFaction: null,
          },
        ])
      ),

      contributions: [],
      phaseHistory: [],

      config: {
        escalationDurationMinutes: body.config?.escalationDurationMinutes ?? 60,
        conflictDurationMinutes: body.config?.conflictDurationMinutes ?? 240,
        resolutionDurationMinutes: body.config?.resolutionDurationMinutes ?? 30,
        victoryThreshold: body.config?.victoryThreshold ?? 1000,
        maxObjectives: body.config?.maxObjectives ?? 5,
      },
    };

    await this.saveState();

    return new Response(JSON.stringify({
      success: true,
      state: this.serializeState(),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private handleGetState(): Response {
    if (!this.warState) {
      return new Response(JSON.stringify({ error: 'War not initialized' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      state: this.serializeState(),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleContribute(request: Request): Promise<Response> {
    if (!this.warState) {
      return new Response(JSON.stringify({ error: 'War not initialized' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (this.warState.phase === 'ENDED') {
      return new Response(JSON.stringify({ error: 'War has ended' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as {
      characterId: string;
      characterName: string;
      factionId: string;
      contributionType: WarContribution['contributionType'];
      value: number;
      objectiveId?: string;
    };

    const contribution = this.addContribution(body);

    await this.saveState();

    // Broadcast contribution
    this.broadcast({ type: 'CONTRIBUTION', contribution });

    // Check for victory
    this.checkVictoryCondition();

    return new Response(JSON.stringify({
      success: true,
      contribution,
      factionScore: body.factionId === this.warState.attackerFaction.factionId
        ? this.warState.attackerFaction.totalScore
        : this.warState.defenderFaction.totalScore,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleAdvancePhase(): Promise<Response> {
    if (!this.warState) {
      return new Response(JSON.stringify({ error: 'War not initialized' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const previousPhase = this.warState.phase;
    const now = new Date().toISOString();

    // Record phase history
    this.warState.phaseHistory.push({
      phase: previousPhase,
      startedAt: this.warState.phaseStartedAt,
      endedAt: now,
      attackerScore: this.warState.attackerFaction.totalScore,
      defenderScore: this.warState.defenderFaction.totalScore,
    });

    // Advance phase
    switch (previousPhase) {
      case 'ESCALATION':
        this.warState.phase = 'CONFLICT';
        break;
      case 'CONFLICT':
        this.warState.phase = 'RESOLUTION';
        break;
      case 'RESOLUTION':
        this.warState.phase = 'ENDED';
        this.warState.endedAt = now;
        break;
      case 'ENDED':
        return new Response(JSON.stringify({ error: 'War already ended' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }

    this.warState.phaseStartedAt = now;

    await this.saveState();

    // Broadcast phase change
    this.broadcast({
      type: 'PHASE_CHANGE',
      phase: this.warState.phase,
      previousPhase,
    });

    // If war ended, broadcast final result
    if (this.warState.phase === 'ENDED') {
      const winner = this.warState.attackerFaction.totalScore > this.warState.defenderFaction.totalScore
        ? this.warState.attackerFaction.factionName
        : this.warState.defenderFaction.factionName;

      this.broadcast({
        type: 'WAR_ENDED',
        winner,
        finalScores: {
          attacker: this.warState.attackerFaction.totalScore,
          defender: this.warState.defenderFaction.totalScore,
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      phase: this.warState.phase,
      previousPhase,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleCompleteObjective(request: Request): Promise<Response> {
    if (!this.warState) {
      return new Response(JSON.stringify({ error: 'War not initialized' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as {
      objectiveId: string;
      factionId: string;
    };

    const objective = this.warState.objectives.get(body.objectiveId);
    if (!objective) {
      return new Response(JSON.stringify({ error: 'Objective not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (objective.isComplete) {
      return new Response(JSON.stringify({ error: 'Objective already completed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Complete the objective
    objective.isComplete = true;
    objective.completedBy = body.factionId;
    objective.completedAt = new Date().toISOString();
    objective.controllingFaction = body.factionId;

    // Award bonus score
    const bonusScore = objective.targetScore;
    const faction = body.factionId === this.warState.attackerFaction.factionId
      ? this.warState.attackerFaction
      : this.warState.defenderFaction;

    faction.totalScore += bonusScore;
    faction.objectivesCompleted++;

    await this.saveState();

    // Broadcast objective update
    this.broadcast({ type: 'OBJECTIVE_UPDATE', objective });

    // Check for victory
    this.checkVictoryCondition();

    return new Response(JSON.stringify({
      success: true,
      objective,
      bonusScore,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async handleEndWar(request: Request): Promise<Response> {
    if (!this.warState) {
      return new Response(JSON.stringify({ error: 'War not initialized' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as { reason?: string };
    const now = new Date().toISOString();

    // Record final phase
    this.warState.phaseHistory.push({
      phase: this.warState.phase,
      startedAt: this.warState.phaseStartedAt,
      endedAt: now,
      attackerScore: this.warState.attackerFaction.totalScore,
      defenderScore: this.warState.defenderFaction.totalScore,
    });

    this.warState.phase = 'ENDED';
    this.warState.endedAt = now;

    await this.saveState();

    const winner = this.warState.attackerFaction.totalScore > this.warState.defenderFaction.totalScore
      ? this.warState.attackerFaction.factionName
      : this.warState.defenderFaction.factionName;

    // Broadcast war end
    this.broadcast({
      type: 'WAR_ENDED',
      winner,
      finalScores: {
        attacker: this.warState.attackerFaction.totalScore,
        defender: this.warState.defenderFaction.totalScore,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      winner,
      reason: body.reason ?? 'Manual end',
      finalScores: {
        attacker: this.warState.attackerFaction.totalScore,
        defender: this.warState.defenderFaction.totalScore,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ===========================================================================
  // GAME LOGIC
  // ===========================================================================

  private addContribution(data: {
    characterId: string;
    characterName: string;
    factionId: string;
    contributionType: WarContribution['contributionType'];
    value: number;
    objectiveId?: string;
  }): WarContribution {
    if (!this.warState) throw new Error('War not initialized');

    const contribution: WarContribution = {
      id: crypto.randomUUID(),
      characterId: data.characterId,
      characterName: data.characterName,
      factionId: data.factionId,
      contributionType: data.contributionType,
      value: data.value,
      objectiveId: data.objectiveId,
      timestamp: new Date().toISOString(),
    };

    // Add to history
    this.warState.contributions.push(contribution);

    // Update faction score
    const faction = data.factionId === this.warState.attackerFaction.factionId
      ? this.warState.attackerFaction
      : this.warState.defenderFaction;

    // Calculate score based on contribution type and war phase
    let scoreMultiplier = 1.0;
    if (this.warState.phase === 'CONFLICT') {
      scoreMultiplier = 1.5; // Combat contributions worth more during conflict
    }

    const scoreGain = Math.floor(data.value * scoreMultiplier);
    faction.totalScore += scoreGain;
    faction.contributions++;

    // Update resources based on type
    switch (data.contributionType) {
      case 'SUPPLY':
        faction.resources.supplies += data.value;
        break;
      case 'INTEL':
        faction.resources.intel += data.value;
        break;
      default:
        faction.resources.credits += Math.floor(data.value * 0.1);
    }

    // Update objective if specified
    if (data.objectiveId) {
      const objective = this.warState.objectives.get(data.objectiveId);
      if (objective && !objective.isComplete) {
        objective.currentScore += data.value;

        // Check if objective is now complete
        if (objective.currentScore >= objective.targetScore) {
          objective.isComplete = true;
          objective.completedBy = data.factionId;
          objective.completedAt = new Date().toISOString();
          objective.controllingFaction = data.factionId;
          faction.objectivesCompleted++;

          // Broadcast objective completion
          this.broadcast({ type: 'OBJECTIVE_UPDATE', objective });
        }
      }
    }

    return contribution;
  }

  private processContribution(
    ws: WebSocket,
    session: { characterId: string; factionId: string },
    data: { [key: string]: unknown }
  ): void {
    if (!this.warState) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        code: 'WAR_NOT_ACTIVE',
        message: 'War is not active',
      }));
      return;
    }

    if (this.warState.phase === 'ENDED') {
      ws.send(JSON.stringify({
        type: 'ERROR',
        code: 'WAR_ENDED',
        message: 'War has ended',
      }));
      return;
    }

    const contribution = this.addContribution({
      characterId: session.characterId,
      characterName: (data.characterName as string) ?? 'Unknown',
      factionId: session.factionId,
      contributionType: (data.contributionType as WarContribution['contributionType']) ?? 'COMBAT',
      value: (data.value as number) ?? 1,
      objectiveId: data.objectiveId as string | undefined,
    });

    // Save state async
    this.saveState();

    // Broadcast to all
    this.broadcast({ type: 'CONTRIBUTION', contribution });

    // Check for victory
    this.checkVictoryCondition();
  }

  private checkVictoryCondition(): void {
    if (!this.warState || this.warState.phase === 'ENDED') return;

    const threshold = this.warState.config.victoryThreshold;

    if (this.warState.attackerFaction.totalScore >= threshold) {
      this.endWarWithVictor(this.warState.attackerFaction.factionId);
    } else if (this.warState.defenderFaction.totalScore >= threshold) {
      this.endWarWithVictor(this.warState.defenderFaction.factionId);
    }
  }

  private endWarWithVictor(winnerFactionId: string): void {
    if (!this.warState) return;

    const now = new Date().toISOString();

    this.warState.phaseHistory.push({
      phase: this.warState.phase,
      startedAt: this.warState.phaseStartedAt,
      endedAt: now,
      attackerScore: this.warState.attackerFaction.totalScore,
      defenderScore: this.warState.defenderFaction.totalScore,
    });

    this.warState.phase = 'ENDED';
    this.warState.endedAt = now;

    const winner = winnerFactionId === this.warState.attackerFaction.factionId
      ? this.warState.attackerFaction.factionName
      : this.warState.defenderFaction.factionName;

    this.broadcast({
      type: 'WAR_ENDED',
      winner,
      finalScores: {
        attacker: this.warState.attackerFaction.totalScore,
        defender: this.warState.defenderFaction.totalScore,
      },
    });

    this.saveState();
  }

  // ===========================================================================
  // STATE PERSISTENCE
  // ===========================================================================

  private serializeState(): SerializedWarState | null {
    if (!this.warState) return null;

    return {
      ...this.warState,
      objectives: Array.from(this.warState.objectives.values()),
      attackerFaction: {
        ...this.warState.attackerFaction,
        participants: Array.from(this.warState.attackerFaction.participants),
      },
      defenderFaction: {
        ...this.warState.defenderFaction,
        participants: Array.from(this.warState.defenderFaction.participants),
      },
    };
  }

  private deserializeState(data: SerializedWarState): WarState {
    return {
      ...data,
      objectives: new Map(data.objectives.map((obj) => [obj.id, obj])),
      attackerFaction: {
        ...data.attackerFaction,
        participants: new Set(data.attackerFaction.participants),
      },
      defenderFaction: {
        ...data.defenderFaction,
        participants: new Set(data.defenderFaction.participants),
      },
    };
  }

  private async saveState(): Promise<void> {
    if (!this.warState) return;
    await this.ctx.storage.put('war', this.serializeState());
  }

  private async loadState(): Promise<void> {
    const stored = await this.ctx.storage.get<SerializedWarState>('war');
    if (stored) {
      this.warState = this.deserializeState(stored);
    }
  }
}
