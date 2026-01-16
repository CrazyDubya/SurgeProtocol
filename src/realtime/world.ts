/**
 * Surge Protocol - WorldClock Durable Object
 *
 * Manages global game time, weather, and scheduled events.
 * Single instance for the entire game world.
 */

// =============================================================================
// TYPES
// =============================================================================

/** Time of day periods */
export type TimeOfDay = 'DAWN' | 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'MIDNIGHT';

/** Weather conditions */
export type WeatherType =
  | 'CLEAR'
  | 'OVERCAST'
  | 'RAIN'
  | 'HEAVY_RAIN'
  | 'STORM'
  | 'ACID_RAIN'
  | 'SMOG'
  | 'FOG';

/** Weather effects on gameplay */
export interface WeatherEffects {
  visibility: number;      // 0-100, affects ranged combat
  handling: number;        // -3 to +1, affects vehicle checks
  payModifier: number;     // -0.2 to +0.5, affects delivery pay
  mood: string;            // Narrative flavor
}

/** Scheduled event */
export interface ScheduledEvent {
  id: string;
  triggerTime: number;     // Game time in minutes
  type: string;
  payload: unknown;
  recurring?: {
    interval: number;      // Minutes between occurrences
    count?: number;        // Max occurrences (undefined = infinite)
  };
  executedCount: number;
}

/** World clock state */
export interface WorldClockState {
  /** Real-world timestamp when clock started */
  realStartTime: number;
  /** Game time in minutes since midnight of day 1 */
  gameTimeMinutes: number;
  /** Current weather */
  weather: WeatherType;
  /** When weather last changed (game time) */
  weatherChangedAt: number;
  /** Scheduled events */
  events: ScheduledEvent[];
  /** Time acceleration factor (real seconds per game minute) */
  timeScale: number;
  /** Whether clock is paused */
  paused: boolean;
}

/** WebSocket message types */
export type WorldWSMessageType =
  | 'TIME_UPDATE'
  | 'WEATHER_CHANGE'
  | 'EVENT_TRIGGERED'
  | 'CLOCK_PAUSED'
  | 'CLOCK_RESUMED'
  | 'PONG';

/** Outbound message */
export interface WorldServerMessage {
  type: WorldWSMessageType;
  timestamp: number;
  payload: unknown;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Default time scale: 1 real second = 1 game minute */
const DEFAULT_TIME_SCALE = 1;

/** Weather effect definitions */
const WEATHER_EFFECTS: Record<WeatherType, WeatherEffects> = {
  CLEAR: {
    visibility: 100,
    handling: 0,
    payModifier: 0,
    mood: 'The neon cuts clean through the night air.',
  },
  OVERCAST: {
    visibility: 80,
    handling: 0,
    payModifier: 0,
    mood: 'Grey clouds swallow the corporate spires.',
  },
  RAIN: {
    visibility: 60,
    handling: -1,
    payModifier: 0.1,
    mood: 'Rain streaks down your visor. The streets shine like oil.',
  },
  HEAVY_RAIN: {
    visibility: 40,
    handling: -2,
    payModifier: 0.2,
    mood: 'The downpour hammers the city. Smart couriers stay in. You\'re not smart.',
  },
  STORM: {
    visibility: 30,
    handling: -3,
    payModifier: 0.3,
    mood: 'Lightning tears the sky. Thunder drowns out the Algorithm\'s whisper.',
  },
  ACID_RAIN: {
    visibility: 50,
    handling: -2,
    payModifier: 0.4,
    mood: 'The rain burns. Cheap chrome pits and scars. Premium delivery rates.',
  },
  SMOG: {
    visibility: 30,
    handling: -1,
    payModifier: 0.15,
    mood: 'The air tastes like copper and regret. Visibility: optional.',
  },
  FOG: {
    visibility: 20,
    handling: -1,
    payModifier: 0.2,
    mood: 'The fog rolls in from the bay. Shapes emerge and vanish.',
  },
};

/** Time of day definitions (game minutes from midnight) */
const TIME_PERIODS: Array<{ start: number; end: number; period: TimeOfDay }> = [
  { start: 0, end: 300, period: 'MIDNIGHT' },      // 00:00 - 05:00
  { start: 300, end: 420, period: 'DAWN' },        // 05:00 - 07:00
  { start: 420, end: 720, period: 'MORNING' },     // 07:00 - 12:00
  { start: 720, end: 1020, period: 'AFTERNOON' },  // 12:00 - 17:00
  { start: 1020, end: 1260, period: 'EVENING' },   // 17:00 - 21:00
  { start: 1260, end: 1440, period: 'NIGHT' },     // 21:00 - 24:00
];

// =============================================================================
// DURABLE OBJECT
// =============================================================================

export class WorldClock {
  private state: DurableObjectState;
  private sessions: Set<WebSocket>;
  private clockState: WorldClockState | null;
  private tickInterval: number | null;

  constructor(state: DurableObjectState, _env: unknown) {
    this.state = state;
    this.sessions = new Set();
    this.clockState = null;
    this.tickInterval = null;
  }

  async fetch(request: Request): Promise<Response> {
    // Load state if not loaded
    if (!this.clockState) {
      await this.loadState();
    }

    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket();
    }

    // HTTP endpoints
    switch (url.pathname) {
      case '/time':
        return this.handleGetTime();
      case '/weather':
        return this.handleGetWeather();
      case '/set-weather':
        return this.handleSetWeather(request);
      case '/schedule':
        return this.handleScheduleEvent(request);
      case '/pause':
        return this.handlePause();
      case '/resume':
        return this.handleResume();
      case '/advance':
        return this.handleAdvance(request);
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  // ---------------------------------------------------------------------------
  // HTTP Handlers
  // ---------------------------------------------------------------------------

  private handleGetTime(): Response {
    if (!this.clockState) {
      return new Response(
        JSON.stringify({ error: 'Clock not initialized' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const currentTime = this.getCurrentGameTime();
    const timeOfDay = this.getTimeOfDay(currentTime);
    const { hours, minutes, day } = this.parseGameTime(currentTime);

    return new Response(
      JSON.stringify({
        gameTimeMinutes: currentTime,
        day,
        hours,
        minutes,
        timeOfDay,
        formatted: this.formatTime(currentTime),
        paused: this.clockState.paused,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  private handleGetWeather(): Response {
    if (!this.clockState) {
      return new Response(
        JSON.stringify({ error: 'Clock not initialized' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const effects = WEATHER_EFFECTS[this.clockState.weather];

    return new Response(
      JSON.stringify({
        weather: this.clockState.weather,
        effects,
        changedAt: this.clockState.weatherChangedAt,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  private async handleSetWeather(request: Request): Promise<Response> {
    if (!this.clockState) {
      return new Response(
        JSON.stringify({ error: 'Clock not initialized' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json() as { weather: WeatherType };
    const previousWeather = this.clockState.weather;

    this.clockState.weather = body.weather;
    this.clockState.weatherChangedAt = this.getCurrentGameTime();

    await this.saveState();

    this.broadcast({
      type: 'WEATHER_CHANGE',
      timestamp: Date.now(),
      payload: {
        previous: previousWeather,
        current: body.weather,
        effects: WEATHER_EFFECTS[body.weather],
      },
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  private async handleScheduleEvent(request: Request): Promise<Response> {
    if (!this.clockState) {
      return new Response(
        JSON.stringify({ error: 'Clock not initialized' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json() as Omit<ScheduledEvent, 'id' | 'executedCount'>;

    const event: ScheduledEvent = {
      ...body,
      id: crypto.randomUUID(),
      executedCount: 0,
    };

    this.clockState.events.push(event);
    await this.saveState();

    return new Response(
      JSON.stringify({ success: true, eventId: event.id }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  private async handlePause(): Promise<Response> {
    if (!this.clockState) {
      return new Response(
        JSON.stringify({ error: 'Clock not initialized' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update game time before pausing
    this.clockState.gameTimeMinutes = this.getCurrentGameTime();
    this.clockState.realStartTime = Date.now();
    this.clockState.paused = true;

    await this.saveState();

    this.broadcast({
      type: 'CLOCK_PAUSED',
      timestamp: Date.now(),
      payload: { gameTime: this.clockState.gameTimeMinutes },
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  private async handleResume(): Promise<Response> {
    if (!this.clockState) {
      return new Response(
        JSON.stringify({ error: 'Clock not initialized' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    this.clockState.realStartTime = Date.now();
    this.clockState.paused = false;

    await this.saveState();

    this.broadcast({
      type: 'CLOCK_RESUMED',
      timestamp: Date.now(),
      payload: { gameTime: this.clockState.gameTimeMinutes },
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  private async handleAdvance(request: Request): Promise<Response> {
    if (!this.clockState) {
      return new Response(
        JSON.stringify({ error: 'Clock not initialized' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json() as { minutes: number };

    // Update current time first
    this.clockState.gameTimeMinutes = this.getCurrentGameTime() + body.minutes;
    this.clockState.realStartTime = Date.now();

    // Check for triggered events
    await this.checkEvents();

    await this.saveState();

    this.broadcast({
      type: 'TIME_UPDATE',
      timestamp: Date.now(),
      payload: this.getTimePayload(),
    });

    return new Response(
      JSON.stringify({ success: true, newTime: this.clockState.gameTimeMinutes }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ---------------------------------------------------------------------------
  // WebSocket Handling
  // ---------------------------------------------------------------------------

  private handleWebSocket(): Response {
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    this.state.acceptWebSocket(server);
    this.sessions.add(server);

    // Send current state
    if (this.clockState) {
      server.send(JSON.stringify({
        type: 'TIME_UPDATE',
        timestamp: Date.now(),
        payload: this.getTimePayload(),
      }));
    }

    // Start tick interval if not running
    this.startTicking();

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return;

    try {
      const data = JSON.parse(message) as { type: string };
      if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now(), payload: null }));
      }
    } catch {
      // Ignore invalid messages
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    this.sessions.delete(ws);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    this.sessions.delete(ws);
  }

  // ---------------------------------------------------------------------------
  // Time Logic
  // ---------------------------------------------------------------------------

  private startTicking(): void {
    if (this.tickInterval !== null) return;

    // Tick every 10 real seconds
    this.state.storage.setAlarm(Date.now() + 10000);
  }

  async alarm(): Promise<void> {
    if (!this.clockState || this.clockState.paused) {
      // Reschedule even if paused to keep checking
      this.state.storage.setAlarm(Date.now() + 10000);
      return;
    }

    // Check for triggered events
    await this.checkEvents();

    // Broadcast time update to all connected clients
    if (this.sessions.size > 0) {
      this.broadcast({
        type: 'TIME_UPDATE',
        timestamp: Date.now(),
        payload: this.getTimePayload(),
      });
    }

    // Schedule next alarm
    this.state.storage.setAlarm(Date.now() + 10000);
  }

  private getCurrentGameTime(): number {
    if (!this.clockState) return 0;

    if (this.clockState.paused) {
      return this.clockState.gameTimeMinutes;
    }

    const realElapsed = (Date.now() - this.clockState.realStartTime) / 1000;
    const gameElapsed = realElapsed / this.clockState.timeScale;

    return this.clockState.gameTimeMinutes + gameElapsed;
  }

  private getTimeOfDay(gameMinutes: number): TimeOfDay {
    const minutesInDay = gameMinutes % 1440; // 24 * 60

    for (const period of TIME_PERIODS) {
      if (minutesInDay >= period.start && minutesInDay < period.end) {
        return period.period;
      }
    }

    return 'MIDNIGHT';
  }

  private parseGameTime(gameMinutes: number): { hours: number; minutes: number; day: number } {
    const day = Math.floor(gameMinutes / 1440) + 1;
    const remainingMinutes = gameMinutes % 1440;
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = Math.floor(remainingMinutes % 60);

    return { hours, minutes, day };
  }

  private formatTime(gameMinutes: number): string {
    const { hours, minutes, day } = this.parseGameTime(gameMinutes);
    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    return `Day ${day}, ${h}:${m}`;
  }

  private getTimePayload(): object {
    const currentTime = this.getCurrentGameTime();
    const { hours, minutes, day } = this.parseGameTime(currentTime);

    return {
      gameTimeMinutes: currentTime,
      day,
      hours,
      minutes,
      timeOfDay: this.getTimeOfDay(currentTime),
      formatted: this.formatTime(currentTime),
      weather: this.clockState?.weather,
      weatherEffects: this.clockState ? WEATHER_EFFECTS[this.clockState.weather] : null,
      paused: this.clockState?.paused ?? false,
    };
  }

  // ---------------------------------------------------------------------------
  // Event System
  // ---------------------------------------------------------------------------

  private async checkEvents(): Promise<void> {
    if (!this.clockState) return;

    const currentTime = this.getCurrentGameTime();
    const triggeredEvents: ScheduledEvent[] = [];

    for (const event of this.clockState.events) {
      if (event.triggerTime <= currentTime) {
        // Check if recurring
        if (event.recurring) {
          if (event.recurring.count === undefined || event.executedCount < event.recurring.count) {
            triggeredEvents.push(event);
            event.executedCount++;
            event.triggerTime += event.recurring.interval;
          }
        } else {
          triggeredEvents.push(event);
        }
      }
    }

    // Remove non-recurring triggered events
    this.clockState.events = this.clockState.events.filter(
      e => e.recurring || e.triggerTime > currentTime
    );

    // Broadcast triggered events
    for (const event of triggeredEvents) {
      this.broadcast({
        type: 'EVENT_TRIGGERED',
        timestamp: Date.now(),
        payload: {
          eventId: event.id,
          eventType: event.type,
          eventPayload: event.payload,
        },
      });
    }

    if (triggeredEvents.length > 0) {
      await this.saveState();
    }
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  private broadcast(message: WorldServerMessage): void {
    const json = JSON.stringify(message);
    for (const ws of this.sessions) {
      try {
        ws.send(json);
      } catch {
        this.sessions.delete(ws);
      }
    }
  }

  private async saveState(): Promise<void> {
    if (!this.clockState) return;
    await this.state.storage.put('clock', this.clockState);
  }

  private async loadState(): Promise<void> {
    const stored = await this.state.storage.get<WorldClockState>('clock');
    if (stored) {
      this.clockState = stored;
    } else {
      // Initialize default state
      this.clockState = {
        realStartTime: Date.now(),
        gameTimeMinutes: 360, // Start at 06:00 (dawn)
        weather: 'CLEAR',
        weatherChangedAt: 0,
        events: [],
        timeScale: DEFAULT_TIME_SCALE,
        paused: false,
      };
      await this.saveState();
    }
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export { WEATHER_EFFECTS, TIME_PERIODS };
