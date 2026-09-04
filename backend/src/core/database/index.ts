// Core Database Service for Enterprise Restaurant Ecosystem
import { Env } from '../types/database';

export class DatabaseService {
  private db: D1Database;

  constructor(env: Env) {
    this.db = env.DB;
  }

  // Generic query methods
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    try {
      const stmt = this.db.prepare(sql);
      const result = params ? stmt.bind(...params) : stmt;
      const { results } = await result.all();
      return results as T[];
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error(`Query failed: ${error.message}`);
    }
  }

  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    try {
      const stmt = this.db.prepare(sql);
      const result = params ? stmt.bind(...params) : stmt;
      const { results } = await result.all();
      return results.length > 0 ? (results[0] as T) : null;
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error(`Query failed: ${error.message}`);
    }
  }

  async execute(sql: string, params?: any[]): Promise<D1Result> {
    try {
      const stmt = this.db.prepare(sql);
      const result = params ? stmt.bind(...params) : stmt;
      return await result.run();
    } catch (error) {
      console.error('Database execute error:', error);
      throw new Error(`Execute failed: ${error.message}`);
    }
  }

  // Transaction support
  async transaction<T>(callback: (tx: D1Database) => Promise<T>): Promise<T> {
    // Note: D1 doesn't support explicit transactions yet
    // This is a placeholder for future transaction support
    try {
      return await callback(this.db);
    } catch (error) {
      console.error('Transaction error:', error);
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  // Batch operations
  async batch(queries: Array<{ sql: string; params?: any[] }>): Promise<D1Result[]> {
    try {
      const statements = queries.map(q => {
        const stmt = this.db.prepare(q.sql);
        return q.params ? stmt.bind(...q.params) : stmt;
      });
      
      return await this.db.batch(statements);
    } catch (error) {
      console.error('Batch operation error:', error);
      throw new Error(`Batch failed: ${error.message}`);
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.queryOne('SELECT 1 as test');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  // Table-specific helpers
  async findById<T>(table: string, id: string): Promise<T | null> {
    const sql = `SELECT * FROM ${table} WHERE id = ?`;
    return await this.queryOne<T>(sql, [id]);
  }

  async findAll<T>(table: string, options?: {
    where?: string;
    params?: any[];
    orderBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<T[]> {
    let sql = `SELECT * FROM ${table}`;
    const params: any[] = [];

    if (options?.where) {
      sql += ` WHERE ${options.where}`;
      if (options.params) {
        params.push(...options.params);
      }
    }

    if (options?.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`;
    }

    if (options?.limit) {
      sql += ` LIMIT ?`;
      params.push(options.limit);
    }

    if (options?.offset) {
      sql += ` OFFSET ?`;
      params.push(options.offset);
    }

    return await this.query<T>(sql, params);
  }

  async create<T>(table: string, data: Partial<T>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');

    const sql = `
      INSERT INTO ${table} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.queryOne<T>(sql, values);
    if (!result) {
      throw new Error('Failed to create record');
    }

    return result;
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');

    const sql = `
      UPDATE ${table}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      RETURNING *
    `;

    const result = await this.queryOne<T>(sql, [...values, id]);
    if (!result) {
      throw new Error('Failed to update record');
    }

    return result;
  }

  async delete(table: string, id: string): Promise<boolean> {
    const sql = `DELETE FROM ${table} WHERE id = ?`;
    const result = await this.execute(sql, [id]);
    return result.changes > 0;
  }

  async count(table: string, where?: string, params?: any[]): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${table}`;
    const queryParams: any[] = [];

    if (where) {
      sql += ` WHERE ${where}`;
      if (params) {
        queryParams.push(...params);
      }
    }

    const result = await this.queryOne<{ count: number }>(sql, queryParams);
    return result?.count || 0;
  }

  // Soft delete support
  async softDelete(table: string, id: string): Promise<boolean> {
    const sql = `
      UPDATE ${table}
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const result = await this.execute(sql, [id]);
    return result.changes > 0;
  }

  // Pagination helper
  async paginate<T>(table: string, page: number, limit: number, options?: {
    where?: string;
    params?: any[];
    orderBy?: string;
  }): Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const offset = (page - 1) * limit;

    // Get total count
    const whereClause = options?.where || '1=1';
    const countParams = options?.params || [];
    const total = await this.count(table, whereClause, countParams);

    // Get data
    const data = await this.findAll<T>(table, {
      where: options?.where,
      params: options?.params,
      orderBy: options?.orderBy,
      limit,
      offset
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }
}
