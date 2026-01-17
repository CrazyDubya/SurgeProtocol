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

    // Parse VALUES clause to identify which values are parameters (?) vs literals/functions
    const valuesMatch = sql.match(/VALUES\s*\((.+)\)\s*$/is);
    if (!valuesMatch) {
      return { results: [], success: false, meta: { changes: 0, last_row_id: 0 } };
    }

    // Split values carefully, handling function calls like datetime('now')
    const valuesStr = valuesMatch[1]!;
    const values: string[] = [];
    let depth = 0;
    let current = '';
    for (const char of valuesStr) {
      if (char === '(' && depth >= 0) {
        depth++;
        current += char;
      } else if (char === ')' && depth > 0) {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) {
      values.push(current.trim());
    }

    const row: D1Row = {};
    let paramIndex = 0;

    columns.forEach((col, i) => {
      const valueStr = values[i]?.trim() || '?';
      if (valueStr === '?') {
        // Parameter placeholder - use next param
        row[col] = params[paramIndex++];
      } else if (valueStr.toLowerCase().startsWith('datetime(')) {
        // SQL datetime function - use current time
        row[col] = new Date().toISOString();
      } else if (valueStr.toLowerCase() === 'null') {
        row[col] = null;
      } else if (/^['"].*['"]$/.test(valueStr)) {
        // String literal - strip quotes
        row[col] = valueStr.slice(1, -1);
      } else if (/^-?\d+(\.\d+)?$/.test(valueStr)) {
        // Numeric literal
        row[col] = parseFloat(valueStr);
      } else {
        // Other literals or expressions
        row[col] = valueStr;
      }
    });

    if (!this.tables.has(tableName)) {
      this.tables.set(tableName, []);
    }
    this.tables.get(tableName)!.push(row);

    return { results: [], success: true, meta: { changes: 1, last_row_id: 1 } };
  }

  private _handleSelect<T>(sql: string, params: unknown[]): MockD1Result<T> {
    // Parse column aliases (e.g., "col AS alias" or "col as alias")
    const columnAliases: Array<{ original: string; alias: string }> = [];
    const aliasMatches = [...sql.matchAll(/(?:(\w+)\.)?(\w+)\s+[Aa][Ss]\s+(\w+)/g)];
    for (const m of aliasMatches) {
      columnAliases.push({ original: m[2]!, alias: m[3]! });
    }

    // Parse JOIN clauses - simplified regex
    const joinMatches = [...sql.matchAll(/(?:LEFT\s+)?JOIN\s+(\w+)(?:\s+(\w+))?\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/gi)];
    const joins: Array<{
      table: string;
      alias: string;
      leftTable: string;
      leftCol: string;
      rightTable: string;
      rightCol: string;
    }> = joinMatches.map(m => ({
      table: m[1]!,
      alias: m[2] || m[1]!,
      leftTable: m[3]!,
      leftCol: m[4]!,
      rightTable: m[5]!,
      rightCol: m[6]!,
    }));

    // Parse main table (could have alias)
    const tableMatch = sql.match(/FROM\s+(\w+)(?:\s+(?:AS\s+)?(\w+))?/i);
    if (!tableMatch) {
      return { results: [], success: true, meta: { changes: 0, last_row_id: 0 } };
    }

    const tableName = tableMatch[1]!;
    const tableAlias = tableMatch[2] || tableName;
    let rows = [...(this.tables.get(tableName) || [])];

    // Apply JOINs
    for (const join of joins) {
      const joinTable = this.tables.get(join.table) || [];
      rows = rows.map(row => {
        // Determine which side of the join has the value
        let leftVal: unknown;
        let rightVal: unknown;

        // Check if leftTable is main table alias
        if (join.leftTable === tableAlias || join.leftTable === tableName) {
          leftVal = row[join.leftCol];
          const joinRow = joinTable.find(jr => jr[join.rightCol] === leftVal);
          if (joinRow) {
            // Merge with main table taking precedence (don't overwrite main table columns)
            return { ...joinRow, ...row };
          }
        } else if (join.rightTable === tableAlias || join.rightTable === tableName) {
          rightVal = row[join.rightCol];
          const joinRow = joinTable.find(jr => jr[join.leftCol] === rightVal);
          if (joinRow) {
            return { ...joinRow, ...row };
          }
        }
        return row;
      });
    }

    // Handle WHERE clause
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER|GROUP|LIMIT|$)/is);
    if (whereMatch) {
      rows = this._filterByWhere(rows, whereMatch[1]!, params);
    }

    // Handle LIMIT
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      rows = rows.slice(0, parseInt(limitMatch[1]!, 10));
    }

    // Handle aggregate functions (COUNT, SUM, etc.)
    const selectClause = sql.match(/SELECT\s+(.+?)\s+FROM/is)?.[1] || '*';

    // Check for COUNT(*)
    const countMatch = selectClause.match(/COUNT\s*\(\s*\*\s*\)\s*(?:[Aa][Ss]\s+(\w+))?/);
    if (countMatch) {
      const alias = countMatch[1] || 'count';
      return { results: [{ [alias]: rows.length }] as T[], success: true, meta: { changes: 0, last_row_id: 0 } };
    }

    // Check for SUM with CASE (simplified)
    const sumCaseMatches = [...selectClause.matchAll(/SUM\s*\(\s*CASE\s+WHEN\s+(\w+)\s*=\s*'(\w+)'\s+THEN\s+(\w+)\s+ELSE\s+(\d+)\s+END\s*\)\s*(?:[Aa][Ss]\s+(\w+))?/gi)];
    const countCaseMatches = [...selectClause.matchAll(/COUNT\s*\(\s*CASE\s+WHEN\s+(\w+)\s*=\s*'(\w+)'\s+THEN\s+(\d+)\s+END\s*\)\s*(?:[Aa][Ss]\s+(\w+))?/gi)];

    if (sumCaseMatches.length > 0 || countCaseMatches.length > 0) {
      const result: D1Row = {};

      for (const m of countCaseMatches) {
        const [, col, val, , alias = 'count'] = m;
        result[alias] = rows.filter(r => r[col!] === val).length;
      }

      for (const m of sumCaseMatches) {
        const [, col, val, sumCol, defaultVal, alias = 'sum'] = m;
        result[alias] = rows
          .filter(r => r[col!] === val)
          .reduce((acc, r) => acc + (Number(r[sumCol!]) || Number(defaultVal) || 0), 0);
      }

      return { results: [result] as T[], success: true, meta: { changes: 0, last_row_id: 0 } };
    }

    // Check for simple SUM
    const sumMatch = selectClause.match(/SUM\s*\(\s*(\w+)\s*\)\s*(?:[Aa][Ss]\s+(\w+))?/i);
    if (sumMatch) {
      const [, col, alias = 'sum'] = sumMatch;
      const sum = rows.reduce((acc, r) => acc + (Number(r[col!]) || 0), 0);
      return { results: [{ [alias]: sum }] as T[], success: true, meta: { changes: 0, last_row_id: 0 } };
    }

    // Apply column aliases
    if (columnAliases.length > 0) {
      rows = rows.map(row => {
        const newRow = { ...row };
        for (const alias of columnAliases) {
          if (alias.original in newRow) {
            newRow[alias.alias] = newRow[alias.original];
          }
        }
        return newRow;
      });
    }

    return { results: rows as T[], success: true, meta: { changes: 0, last_row_id: 0 } };
  }

  private _filterByWhere(rows: D1Row[], whereClause: string, params: unknown[]): D1Row[] {
    // Skip "1=1" always-true condition
    const cleanedWhere = whereClause.replace(/1\s*=\s*1/g, '').trim();
    if (!cleanedWhere) return rows;

    // Split by AND, respecting parentheses (simple split for now)
    const conditions = cleanedWhere.split(/\s+AND\s+/i).filter(c => c.trim());

    return rows.filter(row => {
      // Reset param index for each row
      let paramIndex = 0;

      return conditions.every(cond => {
        const trimmedCond = cond.trim();

        // Handle OR conditions first (simple case: col = ? OR col = ?)
        if (/\bOR\b/i.test(trimmedCond)) {
          const orParts = trimmedCond.split(/\s+OR\s+/i);
          const startIndex = paramIndex;
          const matched = orParts.some((part, i) => {
            const orMatch = part.trim().match(/(?:(\w+)\.)?(\w+)\s*=\s*\?/);
            if (orMatch) {
              const col = orMatch[2]!;
              const value = params[startIndex + i];
              return row[col] === value;
            }
            return false;
          });
          paramIndex += orParts.length; // Consume all OR params
          return matched;
        }

        // Handle column.field = ? (with table aliases)
        const aliasMatch = trimmedCond.match(/(?:(\w+)\.)?(\w+)\s*(=|<=|>=|<|>|!=|<>)\s*\?/);
        if (aliasMatch) {
          const col = aliasMatch[2]!;
          const operator = aliasMatch[3]!;
          const value = params[paramIndex++];
          const rowValue = row[col];

          // Type-safe comparison
          if (rowValue === undefined || rowValue === null) {
            return operator === '=' ? value === null : false;
          }

          switch (operator) {
            case '=':
              return rowValue === value;
            case '!=':
            case '<>':
              return rowValue !== value;
            case '<':
              return (rowValue as number) < (value as number);
            case '>':
              return (rowValue as number) > (value as number);
            case '<=':
              return (rowValue as number) <= (value as number);
            case '>=':
              return (rowValue as number) >= (value as number);
            default:
              return true;
          }
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

  // Batch execute multiple statements
  async batch(statements: MockD1PreparedStatement[]): Promise<Array<{ success: boolean; meta: { changes: number } }>> {
    const results = [];
    for (const stmt of statements) {
      results.push(await stmt.run());
    }
    return results;
  }

  // Update rows matching condition (helper for tests)
  _updateWhere(tableName: string, where: Record<string, unknown>, updates: Record<string, unknown>): number {
    const rows = this.tables.get(tableName) || [];
    let updateCount = 0;

    rows.forEach(row => {
      const matches = Object.entries(where).every(([key, value]) => row[key] === value);
      if (matches) {
        Object.assign(row, updates);
        updateCount++;
      }
    });

    return updateCount;
  }

  // Get rows from a table (helper for tests)
  _getTable(tableName: string): D1Row[] {
    return this.tables.get(tableName) || [];
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
