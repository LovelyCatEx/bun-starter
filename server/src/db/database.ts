import { existsSync } from 'node:fs';
import { Database } from 'bun:sqlite';
import { drizzle as drizzleSqlite } from 'drizzle-orm/bun-sqlite';
import { migrate as migrateSqlite } from 'drizzle-orm/bun-sqlite/migrator';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { migrate as migratePostgres } from 'drizzle-orm/postgres-js/migrator';
import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2';
import { migrate as migrateMysql } from 'drizzle-orm/mysql2/migrator';
import { createPool } from 'mysql2/promise';
import postgres from 'postgres';

import { config } from '../common/config';
import { LogService } from '../common/service/log-service';
import * as schema from './schema';

/** `drizzle.config.ts` 的 `out`，dev 下相对工作目录（`server/`）。 */
const DEV_MIGRATIONS_FOLDER = './drizzle';

/** 迁移目录里 drizzle 一定会写的那个文件（相对迁移目录），用它认"这个目录是不是迁移目录"。 */
const MIGRATION_JOURNAL = 'meta/_journal.json';

/** 迁移目录名：`drizzle.config.ts` 的 `out` 最后一段。 */
const MIGRATIONS_DIR_NAME = 'drizzle';

/**
 * 迁移目录在哪：dev 读磁盘上的 `server/drizzle`（`bun run db:generate` 生成），
 * 打包后读 `scripts/compile.ts` 用 `--asset` 内嵌进二进制的那一份。哪边都没有就返回 `null`。
 *
 * 内嵌那份的路径**从 `Bun.embeddedFiles` 反推**，不写死 `import.meta.dir/drizzle`：
 * 和 `embedded-static.ts` 反推前端前缀是同一个理由 —— `--asset` 的路径最后落在虚拟根的
 * 哪个位置由 bun 决定（实测 `--asset server/drizzle` 内嵌出来是 `drizzle/…`），
 * 写死会在它换个写法之后静默变成"没有迁移"。
 */
function migrationsFolder(): string | null {
  if (!Bun.isStandaloneExecutable) {
    return existsSync(DEV_MIGRATIONS_FOLDER) ? DEV_MIGRATIONS_FOLDER : null;
  }

  const journal = Bun.embeddedFiles.find((file) =>
    (file as File).name.endsWith(`${MIGRATIONS_DIR_NAME}/${MIGRATION_JOURNAL}`),
  );

  if (journal === undefined) {
    return null;
  }

  // 内嵌名形如 `drizzle/meta/_journal.json`，去掉文件名剩下的是迁移目录。
  const name = (journal as File).name;

  return `${import.meta.dir}/${name.slice(0, -(MIGRATION_JOURNAL.length + 1))}`;
}

/**
 * 启动时把迁移跑到最新。三种方言各有各的 migrator，所以调用点给的是"怎么跑"。
 *
 * 没有迁移目录（schema 还空着，或者编译这个产物时 `server/drizzle` 还没生成）就跳过：
 * 空库启动是脚手架的常态，`db:generate` 之后自然就有内容了。
 */
function applyMigrations(migrate: (migrationsFolder: string) => void) {
  const folder = migrationsFolder();

  if (folder === null) {
    LogService.debug('db', 'no migrations to apply');

    return;
  }

  LogService.info('db', `applying migrations from ${folder} (${config.database.type})`);
  migrate(folder);
}

export function createDatabase() {
  switch (config.database.type) {
    case 'postgres': {
      if (!config.database.url) {
        throw new Error(
          'DATABASE_URL is required when DATABASE_TYPE is set to "postgres"',
        );
      }

      const client = postgres(config.database.url);
      const database = drizzlePostgres({ client, schema });

      applyMigrations((folder) => migratePostgres(database, { migrationsFolder: folder }));

      return database;
    }

    case 'mysql': {
      if (!config.database.url) {
        throw new Error(
          'DATABASE_URL is required when DATABASE_TYPE is set to "mysql"',
        );
      }

      const pool = createPool(config.database.url);
      const database = drizzleMysql(pool, { schema, mode: 'default' });

      applyMigrations((folder) => migrateMysql(database, { migrationsFolder: folder }));

      return database;
    }

    case 'sqlite':
    default: {
      const client = new Database(config.database.sqlitePath);
      const database = drizzleSqlite({ client, schema });

      applyMigrations((folder) => migrateSqlite(database, { migrationsFolder: folder }));

      return database;
    }
  }
}

export const db = createDatabase();
