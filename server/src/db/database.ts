import { Database } from 'bun:sqlite';
import { drizzle as drizzleSqlite } from 'drizzle-orm/bun-sqlite';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2';
import { createPool } from 'mysql2/promise';
import postgres from 'postgres';

import { config } from '../common/config';
import * as schema from './schema';

export function createDatabase() {
  switch (config.database.type) {
    case 'postgres': {
      if (!config.database.url) {
        throw new Error(
          'DATABASE_URL is required when DATABASE_TYPE is set to "postgres"',
        );
      }

      const client = postgres(config.database.url);
      return drizzlePostgres({ client, schema });
    }

    case 'mysql': {
      if (!config.database.url) {
        throw new Error(
          'DATABASE_URL is required when DATABASE_TYPE is set to "mysql"',
        );
      }

      const pool = createPool(config.database.url);
      return drizzleMysql(pool, { schema, mode: 'default' });
    }

    case 'sqlite':
    default: {
      const client = new Database(config.database.sqlitePath);
      return drizzleSqlite({ client, schema });
    }
  }
}

export const db = createDatabase();
