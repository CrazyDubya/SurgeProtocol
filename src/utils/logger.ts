/**
 * Surge Protocol - Structured Logging
 *
 * JSON-formatted logging for production monitoring.
 * Integrates with Cloudflare Workers logging and external services.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  userId?: string;
  characterId?: string;
  path?: string;
  method?: string;
  duration?: number;
  statusCode?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Logger class for structured logging.
 */
export class Logger {
  private context: LogContext;
  private minLevel: LogLevel;

  private static levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(context: LogContext = {}, minLevel: LogLevel = 'info') {
    this.context = context;
    this.minLevel = minLevel;
  }

  /**
   * Create a child logger with additional context.
   */
  child(additionalContext: LogContext): Logger {
    return new Logger(
      { ...this.context, ...additionalContext },
      this.minLevel
    );
  }

  /**
   * Log a debug message.
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Log an info message.
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log a warning message.
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log an error message.
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const errorInfo = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : undefined;

    this.log('error', message, context, errorInfo);
  }

  /**
   * Internal log method.
   */
  private log(
    level: LogLevel,
    message: string,
    additionalContext?: LogContext,
    error?: LogEntry['error']
  ): void {
    if (Logger.levelPriority[level] < Logger.levelPriority[this.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...additionalContext },
    };

    if (error) {
      entry.error = error;
    }

    // Output as JSON for log aggregation
    const output = JSON.stringify(entry);

    switch (level) {
      case 'debug':
      case 'info':
        console.log(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
        console.error(output);
        break;
    }
  }
}

/**
 * Create a request-scoped logger.
 */
export function createRequestLogger(
  requestId: string,
  path: string,
  method: string,
  environment: string
): Logger {
  const minLevel: LogLevel = environment === 'production' ? 'info' : 'debug';

  return new Logger(
    { requestId, path, method },
    minLevel
  );
}

/**
 * Generate a unique request ID.
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}

// =============================================================================
// METRICS TRACKING
// =============================================================================

export interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: string;
}

/**
 * Metrics collector for monitoring.
 */
export class MetricsCollector {
  private metrics: MetricData[] = [];
  private flushThreshold: number;

  constructor(flushThreshold = 100) {
    this.flushThreshold = flushThreshold;
  }

  /**
   * Record a counter metric.
   */
  increment(name: string, value = 1, tags?: Record<string, string>): void {
    this.record(name, value, tags);
  }

  /**
   * Record a gauge metric.
   */
  gauge(name: string, value: number, tags?: Record<string, string>): void {
    this.record(name, value, tags);
  }

  /**
   * Record a timing metric.
   */
  timing(name: string, durationMs: number, tags?: Record<string, string>): void {
    this.record(name, durationMs, { ...tags, unit: 'ms' });
  }

  /**
   * Internal record method.
   */
  private record(name: string, value: number, tags?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      tags,
      timestamp: new Date().toISOString(),
    });

    if (this.metrics.length >= this.flushThreshold) {
      this.flush();
    }
  }

  /**
   * Flush metrics (log or send to external service).
   */
  flush(): MetricData[] {
    const toFlush = [...this.metrics];
    this.metrics = [];

    // In production, this would send to a metrics service
    // For now, we log them
    if (toFlush.length > 0) {
      console.log(JSON.stringify({
        type: 'metrics_batch',
        count: toFlush.length,
        metrics: toFlush,
      }));
    }

    return toFlush;
  }

  /**
   * Get current pending metrics.
   */
  getPending(): MetricData[] {
    return [...this.metrics];
  }
}

// =============================================================================
// REQUEST TIMING
// =============================================================================

/**
 * Timer for measuring request duration.
 */
export class RequestTimer {
  private startTime: number;
  private marks: Map<string, number> = new Map();

  constructor() {
    this.startTime = performance.now();
  }

  /**
   * Mark a checkpoint.
   */
  mark(name: string): void {
    this.marks.set(name, performance.now() - this.startTime);
  }

  /**
   * Get elapsed time since start.
   */
  elapsed(): number {
    return Math.round(performance.now() - this.startTime);
  }

  /**
   * Get all marks with their timings.
   */
  getMarks(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [name, time] of this.marks) {
      result[name] = Math.round(time);
    }
    return result;
  }
}

// =============================================================================
// HONO MIDDLEWARE
// =============================================================================

import type { Context, Next } from 'hono';

/**
 * Logging middleware for Hono.
 */
export function loggingMiddleware() {
  return async (c: Context, next: Next) => {
    const requestId = generateRequestId();
    const timer = new RequestTimer();
    const environment = (c.env?.ENVIRONMENT as string) || 'development';

    const logger = createRequestLogger(
      requestId,
      c.req.path,
      c.req.method,
      environment
    );

    // Attach to context for use in handlers
    c.set('requestId', requestId);
    c.set('logger', logger);
    c.set('timer', timer);

    // Set request ID header
    c.header('X-Request-ID', requestId);

    // Log request start
    logger.info('Request started', {
      userAgent: c.req.header('User-Agent'),
      ip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
    });

    try {
      await next();

      // Log request completion
      const duration = timer.elapsed();
      const statusCode = c.res.status;

      logger.info('Request completed', {
        statusCode,
        duration,
        marks: timer.getMarks(),
      });
    } catch (error) {
      const duration = timer.elapsed();

      logger.error(
        'Request failed',
        error instanceof Error ? error : new Error(String(error)),
        { duration }
      );

      throw error;
    }
  };
}

// Singleton metrics collector
export const metrics = new MetricsCollector();
