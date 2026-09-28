
# bun-starter

Monorepo template powered by Bun.

- **server** — Elysia + Drizzle ORM + Drizzle Kit + Zod
- **web** — Vite + React + React Router + Tailwind CSS + shadcn/ui

The backend is a single package organized into internal feature folders:

- `server/src/common` — config, `request` / `response` base classes (`PageQuery` / `ApiResponse`), `exception` classes, and the response interceptor
- `server/src/db` — Drizzle client and schema
- `server/src/modules/auth` — authentication (JWT login, pluggable `AuthProvider`) — see `server/docs/auth-provider.md`

## Getting started

```bash
bun install
cp server/.env.example server/.env
bun run dev
```

- Backend: http://localhost:5107
- Frontend: http://localhost:5108 — sign in with the built-in `admin` / `admin`

The frontend proxies `/api/*` to the backend, so `fetch('/api/auth/me')` works in development. Every `/api/*` route except `/api/auth/login` requires a token.

## Scripts

| Script | Description |
| --- | --- |
| `bun run dev` | Run server and web in parallel |
| `bun run dev:server` | Run only the server |
| `bun run dev:web` | Run only the web app |
| `bun run build` | Build both workspaces |
| `bun run compile` | Build the frontend, then package the app into self-contained executables under `dist-bin/` |
| `bun run typecheck` | Type-check both workspaces |

Server database scripts (run from `server/`):

| Script | Description |
| --- | --- |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate` | Apply Drizzle migrations |
| `bun run db:studio` | Open Drizzle Studio |

## Standalone build

`bun run compile` builds the frontend and then packages everything — server, frontend,
and the whole Bun runtime — into one executable per platform under `dist-bin/`:

```
dist-bin/bun-starter-0.1.0-darwin-arm64
dist-bin/bun-starter-0.1.0-linux-x64
...
```

The compiled binary embeds `web/dist` and serves it itself, so the whole app runs on a
single port (no `node_modules`, no bun, no separate web server needed). It takes the
usual `APP_PORT` / `AUTH_JWT_SECRET` from the environment — see below.

The name and version in those file names come from **`app.config.ts`** at the repo root,
the single place both the backend and the frontend read them from. Changing the version
is documented in `.claude/skills/app-version/SKILL.md`.

## Configuration

All settings are read from environment variables and validated with Zod. Copy the
example file and adjust it as needed:

```bash
cp .env.example server/.env
```

| Variable | Default | Description |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development`, `test`, or `production` |
| `APP_PORT` | `5107` | Backend port |
| `CORS_ORIGIN` | `http://localhost:5108` | Allowed CORS origin |
| `DATABASE_TYPE` | `sqlite` | `sqlite`, `postgres`, or `mysql` |
| `SQLITE_PATH` | `./data.db` | SQLite file path (resolved against the server working directory) |
| `DATABASE_URL` | — | Full connection URL for Postgres/MySQL |
| `DATABASE_HOST` | — | Host used when `DATABASE_URL` is not set |
| `DATABASE_PORT` | `5432` / `3306` | Port used when `DATABASE_URL` is not set |
| `DATABASE_USER` | — | User used when `DATABASE_URL` is not set |
| `DATABASE_PASSWORD` | — | Password used when `DATABASE_URL` is not set |
| `DATABASE_NAME` | — | Database name used when `DATABASE_URL` is not set |
| `AUTH_JWT_SECRET` | — | HS256 signing secret (≥16 chars). **Required in production** |
| `AUTH_TOKEN_TTL` | `604800` | Token lifetime in seconds |

The web app reads its own `.env` (`VITE_AUTH_MODE=cookie|localstorage`, default
`cookie`) — see `web/.env.example`.

## Authentication

Login state is a stateless HS256 JWT, accepted either from an httpOnly cookie or
an `Authorization: Bearer` header. Without an injected `AuthProvider` the server
falls back to a built-in `admin` / `admin` account (development only). To plug in
your own user table, implement `AuthProvider` and pass it to `createAuthPlugin()`
in `server/src/main.ts` — see `server/docs/auth-provider.md`.

The database schema is intentionally left empty; add your Drizzle tables in
`server/src/db/schema.ts`.
