import path from 'node:path';
import { z } from 'zod';

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optionalNumberFromEnv = z.preprocess(
  (value) => (value === undefined || value === '' ? undefined : Number(value)),
  z.number().int().positive().optional(),
);

const numberFromEnvWithDefault = (defaultValue: number) =>
  z.preprocess(
    (value) =>
      value === undefined || value === '' ? defaultValue : Number(value),
    z.number().int().positive(),
  );

const EnvSchema = z.object({
  NODE_ENV: z.preprocess(
    emptyToUndefined,
    z.enum(['development', 'test', 'production']).default('development'),
  ),
  APP_PORT: numberFromEnvWithDefault(5107),
  CORS_ORIGIN: z.preprocess(
    emptyToUndefined,
    z.string().default('http://localhost:5108'),
  ),

  DATABASE_TYPE: z.preprocess(
    emptyToUndefined,
    z.enum(['sqlite', 'postgres', 'mysql']).default('sqlite'),
  ),
  DATABASE_URL: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  SQLITE_PATH: z.preprocess(emptyToUndefined, z.string().default('./data.db')),

  DATABASE_HOST: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  DATABASE_PORT: optionalNumberFromEnv,
  DATABASE_USER: z.preprocess(emptyToUndefined, z.string().optional()),
  DATABASE_PASSWORD: z.preprocess(emptyToUndefined, z.string().optional()),
  DATABASE_NAME: z.preprocess(emptyToUndefined, z.string().optional()),

  // Directory the per-tag log files are written to (`LogService`).
  LOG_DIR: z.preprocess(emptyToUndefined, z.string().default('./logs')),

  AUTH_JWT_SECRET: z.preprocess(emptyToUndefined, z.string().min(16).optional()),
  AUTH_TOKEN_TTL: numberFromEnvWithDefault(604800),
});

// Only used when AUTH_JWT_SECRET is not configured. Never rely on it outside development.
const DEV_JWT_SECRET = 'dev-only-insecure-jwt-secret-change-me';

export interface AuthConfig {
  jwtSecret: string;
  tokenTtl: number;
  cookieSecure: boolean;
  usingDevSecret: boolean;
}

export type Env = z.infer<typeof EnvSchema>;
export type DatabaseType = Env['DATABASE_TYPE'];

export interface DatabaseConfig {
  type: DatabaseType;
  url?: string;
  sqlitePath: string;
}

export class Config {
  readonly env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  static from(env: NodeJS.ProcessEnv = process.env): Config {
    const result = EnvSchema.safeParse(env);

    if (!result.success) {
      console.error('Invalid environment variables:', result.error.issues);
      throw new Error('Invalid environment variables');
    }

    return new Config(result.data);
  }

  get nodeEnv() {
    return this.env.NODE_ENV;
  }

  get isProduction() {
    return this.env.NODE_ENV === 'production';
  }

  get port() {
    return this.env.APP_PORT;
  }

  get corsOrigin() {
    return this.env.CORS_ORIGIN;
  }

  get database(): DatabaseConfig {
    return {
      type: this.env.DATABASE_TYPE,
      url: this.resolveDatabaseUrl(),
      sqlitePath: this.resolveSqlitePath(),
    };
  }

  get logDir(): string {
    // Resolved to an absolute path like the SQLite one, so the same value works
    // on Windows and does not follow the working directory around.
    return path.resolve(process.cwd(), this.env.LOG_DIR);
  }

  get auth(): AuthConfig {
    return {
      jwtSecret: this.env.AUTH_JWT_SECRET ?? DEV_JWT_SECRET,
      tokenTtl: this.env.AUTH_TOKEN_TTL,
      cookieSecure: this.isProduction,
      usingDevSecret: this.env.AUTH_JWT_SECRET === undefined,
    };
  }

  private resolveSqlitePath(): string {
    const value = this.env.SQLITE_PATH;

    if (value.startsWith('file:')) {
      return value;
    }

    // Resolve to an absolute path so it also works on Windows.
    return path.resolve(process.cwd(), value);
  }

  private resolveDatabaseUrl(): string | undefined {
    if (this.env.DATABASE_URL) {
      return this.env.DATABASE_URL;
    }

    if (this.env.DATABASE_TYPE === 'sqlite') {
      return this.resolveSqlitePath();
    }

    if (this.env.DATABASE_HOST || this.env.DATABASE_NAME) {
      const type = this.env.DATABASE_TYPE;
      const port = this.env.DATABASE_PORT ?? (type === 'postgres' ? 5432 : 3306);
      const host = this.env.DATABASE_HOST ?? 'localhost';
      const user = this.env.DATABASE_USER ?? '';
      const password = this.env.DATABASE_PASSWORD ?? '';
      const name = this.env.DATABASE_NAME ?? '';
      const auth = user ? (password ? `${user}:${password}@` : `${user}@`) : '';

      return `${type}://${auth}${host}:${port}/${name}`;
    }

    return undefined;
  }
}

export const config = Config.from(process.env);
