# 接入自己的账号体系（AuthProvider）

脚手架内置的 `admin` / `admin` 只是**开发兜底**，用来让你第一天就能跑通登录。接入真实用户表只需要写一个类、改 `main.ts` 一行。

- 唯一扩展点：`server/src/modules/auth/provider/auth-provider.ts` 的 `AuthProvider` 接口
- 装配点：`server/src/main.ts`（组合根）
- 参考实现：`server/src/modules/auth/provider/in-memory-auth-provider.ts`

## 1. 唯一扩展点

```ts
// server/src/modules/auth/provider/auth-provider.ts
export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
}

export interface AuthProvider {
  authenticate(credentials: AuthCredentials): Promise<AuthUser | null>;
}
```

**provider 只回答一个问题：这组账号密码是不是有效用户？**

- 返回 `AuthUser` → 登录成功，`AuthUser` 会被写进 JWT
- 返回 `null` → 登录失败，接口返回 `401 invalid username or password`
- provider **不要**碰 token、不要验 cookie、不要读 `Authorization` 头——那些是 `AuthService` 与 `auth.interceptor.ts` 的事

## 2. 一次登录发生了什么

```
POST /api/auth/login
  └─ AuthController        校验 body 是否缺字段（缺 → 400）
     └─ AuthService.login
        └─ yourProvider.authenticate()   ← 你实现的那一个方法
           ├─ null        → UnauthorizedException（401）
           └─ AuthUser    → AuthService 用 AUTH_JWT_SECRET 签 HS256 JWT
                            claims: sub / username / name，有效期 AUTH_TOKEN_TTL
                            → 写 httpOnly cookie + 返回 { token, user }
后续任意 /api/* 请求
  └─ auth.interceptor      验签（cookie 或 Authorization: Bearer）→ context.auth
     └─ 你的 handler       直接读 auth，不需要再查库
```

注意最后一步：**每个请求只做 JWT 验签，不会再调 `authenticate`**。需要更细的用户信息（角色、权限、资料）就在 handler 里用 `auth.id` 自己查一次。

## 3. 三步接入

### 第 1 步：写一个 provider

放在 **`server/src/modules/auth/provider/`** 里（它实现的是 auth 模块的接口，按「分层与依赖方向」，不要放到别的模块去 import auth 的东西）。

最直接的写法——自己查库：

```ts
// server/src/modules/auth/provider/db-auth-provider.ts
import { eq } from 'drizzle-orm';
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';

import { db as rawDb } from '../../../db/database';
import * as schema from '../../../db/schema';
import type {
  AuthCredentials,
  AuthProvider,
  AuthUser,
} from './auth-provider';

// database.ts 导出的 db 是 sqlite | postgres | mysql 的三路联合类型（三个 dialect 的
// 查询构造器签名互不兼容），所以使用前要按自己的 DATABASE_TYPE 收窄一次：
//   postgres → drizzle-orm/postgres-js 的 PostgresJsDatabase<typeof schema>
//   mysql    → drizzle-orm/mysql2 的 MySql2Database<typeof schema>
const db = rawDb as BunSQLiteDatabase<typeof schema>;

export class DbAuthProvider implements AuthProvider {
  async authenticate(credentials: AuthCredentials): Promise<AuthUser | null> {
    const [row] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, credentials.username))
      .limit(1);

    if (!row) {
      return null;
    }

    // Bun.password 内置 bcrypt/argon2，不要自己存明文或用 md5
    const valid = await Bun.password.verify(credentials.password, row.passwordHash);
    if (!valid) {
      return null;
    }

    return { id: row.id, username: row.username, name: row.name };
  }
}
```

> 上面那行收窄每个直接用 `db` 的文件都要写一次。嫌烦可以集中到一处，各模块 import 它：
>
> ```ts
> // server/src/db/typed-db.ts
> import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
> import { db } from './database';
> import * as schema from './schema';
>
> export const appDb = db as BunSQLiteDatabase<typeof schema>;
> ```

对应的表（`server/src/db/schema.ts`，示例为 SQLite；pg/mysql 换成 `pgTable` / `mysqlTable`）：

```ts
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
});
```

建表与迁移：

```bash
cd server
bun run db:generate   # 生成迁移
bun run db:migrate    # 执行迁移
```

哈希一个初始密码（Bun 内置，不用装 bcrypt）：

```bash
bun -e "console.log(await Bun.password.hash('你的密码'))"
```

### 第 2 步：在 `main.ts` 注入

```ts
// server/src/main.ts
import { DbAuthProvider } from './modules/auth/provider/db-auth-provider';

const app = new Elysia()
  // ... responseInterceptor / authInterceptor / 你自己的模块路由
  .use(createAuthPlugin(new DbAuthProvider())) // ← 替换掉 createAuthPlugin()
  .listen(config.port);
```

**注入即替换**：一旦传了 provider，内置的 `admin` / `admin` 完全不参与，启动时的 `[auth] No AuthProvider injected` 警告也会消失。

### 第 3 步：配置密钥

```bash
# server/.env
AUTH_JWT_SECRET=至少16个字符的随机串
AUTH_TOKEN_TTL=604800   # 秒，默认 7 天
```

> 没设 `AUTH_JWT_SECRET` 时用的是仓库里公开的 dev 常量，任何人都能伪造 token，启动时也会打印警告。**生产必须设置。**

## 4. 复用已有模块的 service

如果你已经有了 user 模块（`UserService.findByUsername` 之类），不要在文件顶部 `import` 它——那是模块之间的横向依赖，本脚手架不允许。正确做法是**在 provider 里只声明"我需要什么能力"，由组合根 `main.ts` 把具体实现塞进来**：

```ts
// server/src/modules/auth/provider/user-service-auth-provider.ts
import type { AuthCredentials, AuthProvider, AuthUser } from './auth-provider';

interface AccountRecord {
  id: string;
  username: string;
  name: string;
  passwordHash: string;
}

/** 只声明"我需要什么能力"，不 import 任何业务模块 */
export interface AccountLookup {
  findByUsername(username: string): Promise<AccountRecord | null>;
}

export class UserServiceAuthProvider implements AuthProvider {
  private readonly lookup: AccountLookup;

  // 这里用结构类型：UserService 只要有一个签名匹配的 findByUsername 就能传进来，
  // 所以本文件不需要 import user 模块。
  constructor(lookup: AccountLookup) {
    this.lookup = lookup;
  }

  async authenticate(credentials: AuthCredentials): Promise<AuthUser | null> {
    const account = await this.lookup.findByUsername(credentials.username);

    if (!account) {
      return null;
    }

    if (!(await Bun.password.verify(credentials.password, account.passwordHash))) {
      return null;
    }

    return { id: account.id, username: account.username, name: account.name };
  }
}
```

```ts
// server/src/main.ts —— 组合根是唯一允许同时 import common 与各 modules 的地方
import { UserServiceAuthProvider } from './modules/auth/provider/user-service-auth-provider';
import { UserService } from './modules/user/service/user.service';

.use(createAuthPlugin(new UserServiceAuthProvider(new UserService())))
```

如果你的 `UserService` 已经把密码校验封好了（比如直接提供 `verifyPassword(username, password)`），那把 `AccountLookup` 换成对应的方法签名，provider 里直接调即可。

顺便：这也让 provider 可以脱离数据库单测——传个假对象就行。

第三方（LDAP / 外部 HTTP 登录接口）同理，只是 `authenticate` 里换成一次网络调用。

## 5. 验证

```bash
bun run dev:server
# 启动日志里不应再出现 "[auth] No AuthProvider injected"

# 内置账号应立刻失效
curl -s -X POST http://localhost:5107/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin"}'
# → {"code":401,"message":"invalid username or password","data":null}

# 你自己的账号
curl -si -c /tmp/cj.txt -X POST http://localhost:5107/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"你的账号","password":"你的密码"}'
# → 200，响应头带 set-cookie: auth_token=...; HttpOnly; SameSite=Lax

curl -s -b /tmp/cj.txt http://localhost:5107/api/auth/me
# → {"code":0,"message":"ok","data":{"id":"...","username":"...","name":"..."}}
```

## 6. 约定与坑

- **返回 `null` 还是抛异常**：`null` → 统一 401 `invalid username or password`（不暴露是账号错还是密码错）。要区分状态（账号被禁用、需要改密码）就抛 `common/exception` 里的异常，例如 `throw new ForbiddenException('account disabled')`
- **`AuthUser` 目前只有 `id` / `username` / `name`**：`name` 会显示在页面上。要加角色/权限，就扩展这个接口 + 在 `AuthService.signToken` 里加 claim；claims 是**登录时快照**，改了角色要让用户重新登录
- **不要在 `authenticate` 里做每请求都跑的鉴权**：它只在登录时调用一次。细粒度权限判断请用 `auth.id` 在 handler / service 里做
- **不要自己签 token 或塞过期时间**：TTL 由 `AUTH_TOKEN_TTL` 统一控制
- **密码永远用 `Bun.password.hash` / `verify`**，别存明文、别用 md5/sha1
- **想加注册接口**：在 `modules/auth/controller/auth.controller.ts` 加路由，并把路径加进 `modules/auth/interceptor/auth.interceptor.ts` 的 `PUBLIC_PATHS`，否则会被认证拦截器拦下
- **换 provider 不需要动前端**：前端只认 `/api/auth/login`、`/api/auth/logout`、`/api/auth/me` 三个接口

## 7. 相关文件

| 文件 | 说明 |
| --- | --- |
| `server/src/modules/auth/provider/auth-provider.ts` | 你要实现的接口 |
| `server/src/modules/auth/provider/in-memory-auth-provider.ts` | 内置兜底实现（admin/admin） |
| `server/src/modules/auth/auth.plugin.ts` | `createAuthPlugin(provider?)` 工厂，注入点 |
| `server/src/modules/auth/service/auth.service.ts` | 签/验 JWT，调用 provider |
| `server/src/modules/auth/controller/auth.controller.ts` | login / logout / me 三个路由 |
| `server/src/modules/auth/interceptor/auth.interceptor.ts` | 全局验签、`PUBLIC_PATHS`、401 |
| `server/src/main.ts` | 组合根，注入 provider |
| `server/src/common/config.ts` | `AUTH_JWT_SECRET` / `AUTH_TOKEN_TTL` |
