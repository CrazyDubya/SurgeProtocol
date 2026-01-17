/**
 * Mock Cloudflare environment bindings for integration testing.
 *
 * Provides in-memory implementations of D1Database, KVNamespace,
 * and DurableObjectNamespace for testing without Cloudflare.
 */

// =============================================================================
// MOCK D1 DATABASE
// =============================================================================

type D1Row = Record<string, unknown>;

interface MockD1Result<T> {
  results: T[];
  success: boolean;
  meta: { changes: number; last_row_id: number };
}

class MockD1PreparedStatement {
  private sql: string;
  private params: unknown[] = [];
  private db: MockD1Database;

  constructor(sql: string, db: MockD1Database) {
    this.sql = sql;
    this.db = db;
  }

  bind(...values: unknown[]): MockD1PreparedStatement {
    this.params = values;
    return this;
  }

  async first<T = D1Row>(_column?: string): Promise<T | null> {
    const results = await this.all<T>();
    return results.results[0] ?? null;
  }

  async all<T = D1Row>(): Promise<MockD1Result<T>> {
    // Execute against in-memory store
    const result = this.db._execute<T>(this.sql, this.params);
    return result;
  }

  async run(): Promise<{ success: boolean; meta: { changes: number } }> {
    this.db._execute(this.sql, this.params);
    return { success: true, meta: { changes: 1 } };
  }
}

export class MockD1Database {
  private tables: Map<string, D1Row[]> = new Map();
  private autoIncrement: Map<string, number> = new Map();

  prepare(sql: string): MockD1PreparedStatement {
    return new MockD1PreparedStatement(sql, this);
  }

  _execute<T>(sql: string, params: unknown[]): MockD1Result<T> {
    const sqlUpper = sql.toUpperCase().trim();

    if (sqlUpper.startsWith('INSERT')) {
      return this._handleInsert(sql, params) as MockD1Result<T>;
    } else if (sqlUpper.startsWith('SELECT')) {
      return this._handleSelect<T>(sql, params);
    } else if (sqlUpper.startsWith('UPDATE')) {
      return this._handleUpdate(sql, params) as MockD1Result<T>;
    } else if (sqlUpper.startsWith('DELETE')) {
      return this._handleDelete(sql, params) as MockD1Result<T>;
    }

    return { results: [], success: true, meta: { changes: 0, last_row_id: 0 } };
  }

  private _handleInsert(sql: string, params: unknown[]): MockD1Result<D1Row> {
    // Simple INSERT parsing: INSERT INTO table (cols) VALUES (?)
    const tableMatch = sql.match(/INSERT\s+INTO\s+(\w+)/i);
    if (!tableMatch) {
      return { results: [], success: false, meta: { changes: 0, last_row_id: 0 } };
    }

    const tableName = tableMatch[1]!;
    const colsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
    if (!colsMatch) {
      return { results: [], success: false, meta: { changes: 0, last_row_id: 0 } };
    }

    const columns = colsMatch[1]!.split(',').map(c => c.trim());
    const row: D1Row = {};

    columns.forEach((col, i) => {
      row[col] = params[i];
    });

    if (!this.tables.has(tableName)) {
      this.tables.set(tableName, []);
    }
    this.tables.get(tableName)!.push(row);

    return { results: [], success: true, meta: { changes: 1, last_row_id: 1 } };
  }

  private _handleSelect<T>(sql: string, params: unknown[]): MockD1Result<T> {
    // Simple SELECT parsing
    const tableMatch = sql.match(/FROM\s+(\w+)/i);
    if (!tableMatch) {
      return { results: [], success: true, meta: { changes: 0, last_row_id: 0 } };
    }

    const tableName = tableMatch[1]!;
    let rows = this.tables.get(tableName) || [];

    // Handle WHERE clause
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER|LIMIT|$)/is);
    if (whereMatch && params.length > 0) {
      rows = this._filterByWhere(rows, whereMatch[1]!, params);
    }

    // Handle LIMIT
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      rows = rows.slice(0, parseInt(limitMatch[1]!, 10));
    }

    return { results: rows as T[], success: true, meta: { changes: 0, last_row_id: 0 } };
  }

  private _filterByWhere(rows: D1Row[], whereClause: string, params: unknown[]): D1Row[] {
    // Simple WHERE parsing for = conditions
    const conditions = whereClause.split(/\s+AND\s+/i);
    let paramIndex = 0;

    return rows.filter(row => {
      return conditions.every(cond => {
        const match = cond.match(/(\w+)\s*=\s*\?/);
        if (match) {
          const col = match[1]!;
          const value = params[paramIndex++];
          return row[col] === value;
        }
        return true;
      });
    });
  }

  private _handleUpdate(sql: string, params: unknown[]): MockD1Result<D1Row> {
    const tableMatch = sql.match(/UPDATE\s+(\w+)/i);
    if (!tableMatch) {
      return { results: [], success: false, meta: { changes: 0, last_row_id: 0 } };
    }

    const tableName = tableMatch[1]!;
    const rows = this.tables.get(tableName) || [];

    // Simple SET parsing
    const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
    if (!setMatch) {
      return { results: [], success: false, meta: { changes: 0, last_row_id: 0 } };
    }

    const setClauses = setMatch[1]!.split(',').map(c => c.trim());
    const whereMatch = sql.match(/WHERE\s+(.+)/i);

    let updates = 0;
    const whereParams = params.slice(setClauses.length);

    rows.forEach(row => {
      if (whereMatch && whereParams.length > 0) {
        const conditions = whereMatch[1]!.split(/\s+AND\s+/i);
        let paramIdx = 0;
        const matches = conditions.every(cond => {
          const m = cond.match(/(\w+)\s*=\s*\?/);
          if (m) {
            return row[m[1]!] === whereParams[paramIdx++];
          }
          return true;
        });
        if (!matches) return;
      }

      setClauses.forEach((clause, i) => {
        const colMatch = clause.match(/(\w+)\s*=\s*\?/);
        if (colMatch) {
          row[colMatch[1]!] = params[i];
        }
      });
      updates++;
    });

    return { results: [], success: true, meta: { changes: updates, last_row_id: 0 } };
  }

  private _handleDelete(sql: string, params: unknown[]): MockD1Result<D1Row> {
    const tableMatch = sql.match(/DELETE\s+FROM\s+(\w+)/i);
    if (!tableMatch) {
      return { results: [], success: false, meta: { changes: 0, last_row_id: 0 } };
    }

    const tableName = tableMatch[1]!;
    const rows = this.tables.get(tableName) || [];

    const whereMatch = sql.match(/WHERE\s+(.+)/i);
    if (!whereMatch) {
      const count = rows.length;
      this.tables.set(tableName, []);
      return { results: [], success: true, meta: { changes: count, last_row_id: 0 } };
    }

    const filtered = this._filterByWhere(rows, whereMatch[1]!, params);
    const remaining = rows.filter(r => !filtered.includes(r));
    this.tables.set(tableName, remaining);

    return { results: [], success: true, meta: { changes: filtered.length, last_row_id: 0 } };
  }

  // Seed test data
  _seed(tableName: string, rows: D1Row[]): void {
    this.tables.set(tableName, rows);
  }

  // Clear all data
  _clear(): void {
    this.tables.clear();
    this.autoIncrement.clear();
  }
}

// =============================================================================
// MOCK KV NAMESPACE
// =============================================================================

export class MockKVNamespace {
  private store: Map<string, { value: string; metadata?: unknown }> = new Map();

  async get<T = string>(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;

    if (type === 'json') {
      return JSON.parse(item.value) as T;
    }
    return item.value as T;
  }

  async put(key: string, value: string | ArrayBuffer, options?: { expirationTtl?: number; metadata?: unknown }): Promise<void> {
    const strValue = typeof value === 'string' ? value : new TextDecoder().decode(value);
    this.store.set(key, { value: strValue, metadata: options?.metadata });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(options?: { prefix?: string; limit?: number }): Promise<{ keys: Array<{ name: string }> }> {
    const keys = Array.from(this.store.keys())
      .filter(k => !options?.prefix || k.startsWith(options.prefix))
      .slice(0, options?.limit ?? 1000)
      .map(name => ({ name }));
    return { keys };
  }

  _clear(): void {
    this.store.clear();
  }
}

// =============================================================================
// MOCK DURABLE OBJECT
// =============================================================================

class MockDurableObjectStub {
  private id: string;

  constructor(id: string) {
    this.id = id;
  }

  async fetch(request: Request): Promise<Response> {
    // Return mock response for DO calls
    return new Response(JSON.stringify({ success: true, id: this.id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export class MockDurableObjectNamespace {
  idFromName(name: string): { toString(): string } {
    return { toString: () => `do_${name}` };
  }

  get(_id: { toString(): string }): MockDurableObjectStub {
    return new MockDurableObjectStub(_id.toString());
  }
}

// =============================================================================
// CREATE MOCK ENVIRONMENT
// =============================================================================

export interface MockEnv {
  DB: MockD1Database;
  CACHE: MockKVNamespace;
  COMBAT_SESSION: MockDurableObjectNamespace;
  WAR_THEATER: MockDurableObjectNamespace;
  WORLD_CLOCK: MockDurableObjectNamespace;
  JWT_SECRET: string;
  ENVIRONMENT: string;
}

export function createMockEnv(): MockEnv {
  return {
    DB: new MockD1Database(),
    CACHE: new MockKVNamespace(),
    COMBAT_SESSION: new MockDurableObjectNamespace(),
    WAR_THEATER: new MockDurableObjectNamespace(),
    WORLD_CLOCK: new MockDurableObjectNamespace(),
    JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
    ENVIRONMENT: 'test',
  };
}

// =============================================================================
// TEST HELPERS
// =============================================================================

export function createTestRequest(
  method: string,
  path: string,
  options?: {
    body?: unknown;
    headers?: Record<string, string>;
  }
): Request {
  const url = `http://localhost${path}`;
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  };

  if (options?.body) {
    init.body = JSON.stringify(options.body);
  }

  return new Request(url, init);
}

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}
