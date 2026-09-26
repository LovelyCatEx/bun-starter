---
description: 后端（server/）开发规范。写后端代码、加业务模块、动分层与依赖方向、写 controller/service/DTO/VO/拦截器、接数据库或迁移、加配置项、改打包产物时使用。涉及 server/src 的目录结构、common 与 modules 的依赖方向、Elysia 拦截器注册顺序、统一响应与异常、日志、应用标识与单端口打包、index.ts 与代码风格。
paths:
  - "server/**"
  - "app.config.ts"
  - "scripts/**"
  - ".env.example"
---

# 后端规范（`server/`）

Bun + Elysia + Drizzle ORM + Drizzle Kit + Zod。默认端口 `5107`，开发时前端 `5108` 的 `/api/*` 代理到它。

命令、端口、目录概览见 `CLAUDE.md`；前端侧的规范见 `.claude/rules/frontend.md`。

## 架构：单包 + 内部功能域文件夹

后端是**单包 + 内部功能域文件夹**，不再按 workspace 拆包。

```
server/src/
  main.ts                   # 组合根：组装插件、注册模块、listen
  common/                   # 通用能力，禁止依赖 modules/
    config.ts               # Zod env + Config 类
    request/
      page-query.ts         # PageQuery 分页查询基类
      ws-request.ts         # WsRequest：客户端进来的 WS 帧（见「WebSocket」）
    response/
      api-response.ts       # ApiResponse / PaginatedResponseBody
      ws-response.ts        # WsResponse：发给客户端的 WS 帧（见「WebSocket」）
    exception/
      api-exception.ts      # 异常基类
      business-exception.ts # 业务异常
      http-exceptions.ts    # 常用 HTTP 异常
    interceptor/
      response-interceptor.ts # 统一响应/异常拦截器
    service/
      log-service.ts        # LogService：唯一的日志出口（见「日志」）
    static/
      embedded-static.ts    # 打包产物里内嵌前端的服务（见「应用标识与打包」）
  db/
    database.ts             # createDatabase + db 实例
    schema.ts               # Drizzle schema（当前为空）
  modules/
    <feature>/              # 每个业务模块一个包，内部按职责分包
      <feature>.plugin.ts   # 【按需】模块装配入口（工厂 / 注入点）
      controller/           # 【必须有】路由层
        dto/                # 【必须有】请求 DTO
        vo/                 # 【必须有】响应 VO
        <feature>.controller.ts
      service/              # 【必须有】业务逻辑
        <feature>.service.ts
      entity/               # 【必须有】数据表记录对象（无表则留空）
      provider/             # 【按需】可替换实现的接口 + 内置默认实现
      interceptor/          # 【按需】模块自己的拦截器（是一层包，不是文件）
        <feature>.interceptor.ts
    auth/                   # 认证模块（现成参考实现）
```

### 分层与依赖方向（硬性要求）

依赖单向向下，**不允许反向**：

```
main.ts             # 组合根：唯一可以同时 import common 与 modules 的地方
  ↓
modules/<feature>   # 业务模块：可以依赖 common 与自身内部文件
  ↓
common              # 通用能力：config / response / exception / interceptor
```

- **`common/**` 绝对不可以 import `src/modules/**`**。一旦某个"通用"文件需要用到具体业务模块，说明它本身就属于那个模块，应该搬进 `src/modules/<feature>/`。例：认证拦截器在 `modules/auth/interceptor/auth.interceptor.ts`，**不在** `common/interceptor/`
- 模块之间不要互相 import；确实要复用就先下沉到 `common`
- 模块自己的东西一律留在模块内：装配入口 `modules/<feature>/<feature>.plugin.ts` 放模块根目录，拦截器放 `modules/<feature>/interceptor/` 包（见下）
- 反向依赖的判定标准很简单：`grep -rn "modules/" server/src/common/` 必须没有输出

### 模块内的结构

一个模块 = `server/src/modules/<feature>/`，内部**按职责分包**，不要写成散落在模块根目录的文件：

| 包 / 文件 | 必选 | 职责 |
| --- | --- | --- |
| `controller/<feature>.controller.ts` | 是 | 只做路由定义（`new Elysia().group('/api', ...)` 或 `{ prefix }`）与参数校验，转调 service |
| `controller/dto/` | 是（目录） | 请求 DTO，`*.dto.ts` |
| `controller/vo/` | 是（目录） | 响应 VO，`*.vo.ts` |
| `service/<feature>.service.ts` | 是 | 业务逻辑，返回业务数据；失败抛 `ApiException` 家族 |
| `entity/` | 是（目录） | **唯一含义是某张数据表的记录对象**（Drizzle 表 / ORM entity），没有对应表就留空 |
| `provider/` | 按需 | 可替换实现的接口 + 内置默认实现（如 `AuthProvider` / `InMemoryAuthProvider`） |
| `interceptor/` | 按需 | 模块自己的 Elysia 拦截器，`*.interceptor.ts`；**是一层包，可以放多个拦截器** |
| `<feature>.plugin.ts` | 按需 | 模块装配入口（工厂 / 注入点），返回可直接 `.use()` 的 Elysia 实例，放模块根目录 |

规则：

- 必选包与 `dto/` / `vo/` 目录**即使为空也必须保留**，并且**绝对不要**放 `.gitkeep` 之类的占位文件
- **拦截器是包不是文件**：写 `modules/auth/interceptor/auth.interceptor.ts`，不要写成 `modules/auth/auth.interceptor.ts`
- 拦截器用 `new Elysia({ name: '<feature>-xxx' })` 声明，需要全应用生效时给 hook 加 `{ as: 'global' }`，并在 `main.ts` 里于控制器**之前** `.use()`（Elysia 的 hook 只对注册之后的路由生效）
- DTO / VO 都是**类**（不是 interface）；`tsconfig` 开了 `strictPropertyInitialization`，所以要么用构造函数赋值，要么对纯形状 DTO 用 `name!: string`，否则会报 TS2564
- 新功能模块放在 `src/modules/<feature>/`，在 `src/main.ts` 中注册

### 新模块示例

```ts
// src/modules/user/controller/dto/create-user.dto.ts
// DTO 只描述请求体形状，不用构造；strictPropertyInitialization 下需要 `!`
export class CreateUserDto {
  name!: string
  email!: string
}

// src/modules/user/controller/vo/user.vo.ts
// VO 由 service 的返回值构造，字段在构造函数里赋值
export class UserVo {
  id: string
  name: string
  email: string

  constructor(data: { id: string; name: string; email: string }) {
    this.id = data.id
    this.name = data.name
    this.email = data.email
  }
}

// src/modules/user/controller/user.controller.ts
import { Elysia } from 'elysia'
import { UserService } from '../service/user.service'

export class UserController {
  private readonly service = new UserService()

  get routes() {
    return new Elysia({ prefix: '/api/user' })
      .get('/', () => this.service.list())
      .post('/', ({ body }) => this.service.create(body))
  }
}
```

```ts
// src/main.ts
import { config } from './common/config'
import { responseInterceptor } from './common/interceptor/response-interceptor'
import { UserController } from './modules/user/controller/user.controller'
import { userInterceptor } from './modules/user/interceptor/user.interceptor'

new Elysia()
  .use(cors({ origin: config.corsOrigin, credentials: true }))
  .use(responseInterceptor)
  // 模块自己的拦截器：必须在控制器之前 .use()，且 hook 是全局的（{ as: 'global' }）
  .use(userInterceptor)
  .get('/health', () => ({ status: 'ok' }))
  .use(new UserController().routes)
  .listen(config.port)
```

## 认证（`server/src/modules/auth/`）

- 认证全部在 `modules/auth/` 内实现，`common/` 不参与（见「分层与依赖方向」）；**接入自己的账号体系看 `server/docs/auth-provider.md`**
- 目录即「模块内的结构」的参考实现：`auth.plugin.ts`（装配入口）+ `controller/`（含 `dto` / `vo`）+ `service/` + `entity/`（空）+ `provider/`（账号校验实现）+ `interceptor/`（认证拦截器）
- **账号校验的唯一扩展点是 `AuthProvider` 接口**（`provider/auth-provider.ts`）：实现 `authenticate(credentials)`，返回 `AuthUser` 或 `null`，数据库 / LDAP / 第三方接口随便接
- 装配在 `main.ts` 里，工厂模式对齐 `createDatabase()`：

```ts
.use(createAuthPlugin())                     // 不注入 → 内置 admin/admin（仅开发用）
.use(createAuthPlugin(new MyAuthProvider())) // 注入 → 内置实现完全不参与
```

- token 是 jose 的 HS256 无状态 JWT，claims 只有 `sub` / `username` / `name`；secret 与有效期来自 `AUTH_JWT_SECRET` / `AUTH_TOKEN_TTL`
- 传输**同时接受**两种，后端不区分模式：httpOnly cookie（`AUTH_COOKIE_NAME = 'auth_token'`，`sameSite=lax`，生产自动 `secure`）+ `Authorization: Bearer <token>`
- **WS 升级不算第三种传输**：升级请求也走同一个 `authInterceptor`（拿不到 token 直接连不上），只是浏览器不能给 WebSocket 加自定义头，所以升级请求额外接受 `?token=`（`pickToken` 里由 `isUpgrade()` 把口子限定在升级请求上 —— 普通请求把 token 拼进 URL 会漏进访问日志和 Referer）
- 鉴权在 `modules/auth/interceptor/auth.interceptor.ts`：`derive({ as: 'global' })` 只解析身份（不通过就是 `null`），`onBeforeHandle({ as: 'global' })` 负责抛 `UnauthorizedException`；handler 里直接读 `auth`
- 只拦 `/api/*`，静态资源与 HTML 不受影响；放行清单是 `PUBLIC_PATHS`，新增公开接口往这里加
- 接口：`POST /api/auth/login`（返回 token + user，同时写 cookie）、`POST /api/auth/logout`、`GET /api/auth/me`
- `AuthController.routes` 里的 `.use(authInterceptor)` **只是为了拿到 `auth` 的类型**，插件按名字去重，不会重复执行

前端侧（token 存哪、401 怎么处理、路由守卫）见 `.claude/rules/frontend.md` 的「认证」一节。

**cookie 的同站限制**：`SameSite=Lax` 只适用于"前后端同站"（开发时 vite 代理即同源，单端口打包同样同源）。跨站部署需要改成 `SameSite=None; Secure`。

## 配置

- 所有项目设置都通过环境变量，由 `src/common/config.ts` 中的 `EnvSchema`（Zod）校验，并导出 `config` 单例和 `Config` 类
- 默认值：`APP_PORT=5107`、`CORS_ORIGIN=http://localhost:5108`、`DATABASE_TYPE=sqlite`、`SQLITE_PATH=./data.db`、`LOG_DIR=./logs`
- 认证相关：`AUTH_JWT_SECRET`（**生产必须设置**，至少 16 字符；为空时回退到不安全的 dev 常量并打印警告）、`AUTH_TOKEN_TTL=604800`（秒，默认 7 天）
- 环境变量文件：后端读 `server/.env`（示例见根目录 `.env.example`）。前端读自己的 `web/.env`，**两者不共享**；`.env` 已被 gitignore，只提交 `.env.example`
- 新增配置项：先在 `EnvSchema` 中声明，再通过 `Config` getter 暴露
- 注意 `SQLITE_PATH` 是相对 `process.cwd()` 解析的，且 Bun 会从**当前目录**自动加载 `.env` —— 换目录启动会换掉读到的 `.env` 和落库位置

## 日志（`common/service/log-service.ts`）

**`server/src/` 下禁止 `console.*`，也不许 `process.stdout/stderr.write`，打印一律走 `LogService`。** 唯一例外是 `common/config.ts` 里环境变量校验失败那一行：它在 `config` 单例构造期间执行，import `LogService` 会构成循环依赖，而且 `LOG_DIR` 那时还没解析出来。

- 静态方法，四个级别，**tag 必填、且是第一个参数**：`LogService.debug|info|warn|error(tag, ...parts)`
- tag 回答"这条日志在说谁"：功能域 / 模块名，小写无前缀（`auth`、`db`、`http`）。进程级日志（启动、致命处理器、还没进入任何请求的配置读取）用 `SYSTEM_TAG`，也就是 `system`
- **没有可选 tag、没有默认 tag**：拿不准就写 `SYSTEM_TAG`，但不要给参数加默认值 —— 有默认值就等于允许功能日志伪装成全局日志，这正是 tag 必填要挡住的
- `...parts` 只放业务内容：不要重复 tag，不要自己拼时间戳 / 级别前缀 / `[ws=…]` 之类装饰，也不要写 `JSON.stringify(x)` 或 `error.message` —— 值渲染已由 `LogService` 负责（`Error` → stack，字符串 → 原样，其他 → JSON）
- 输出：`debug/info/warn` → stdout，`error` → stderr；同时 append 到 `LOG_DIR/<tag>.log`（tag 归一化成文件名，`auth/token` → `auth-token.log`，非法字符会折叠成 `-`）
- 启动时 `main.ts` 调一次 `LogService.init()` 建 `LOG_DIR`。它失败（或某次写文件失败）会让文件日志整体关闭、只留 stdout —— 这是设计如此，**不要在外面补 `console` 兜底**
- 日志写入是 best-effort，不能因为"记录问题"而抛异常打断被记录的流程；业务模块自己 `catch` 到异常时用 `LogService.error(tag, error)`
- 不要为每个 HTTP 请求自动打一行访问日志：日志要能回答"发生了什么"，不是"来过"
- 规则只管 `server/src/`；`scripts/` 下的构建脚本用 `console` 输出是正常的（那些是给人看的命令行输出）
- 自查：`grep -rn "console\.\|process\.stdout\|process\.stderr" server/src/`，只应剩 `log-service.ts` 自己与 `config.ts` 那一处

## 请求 / 响应

- 控制器 handler **直接返回业务数据**，不要手动包 `ApiResponse`
- 成功响应由 `responseInterceptor` 统一包装为：

```json
{ "code": 0, "message": "ok", "data": "业务数据" }
```

- 失败时**抛异常**，由拦截器统一转为 `ApiResponse` 并设置 HTTP 状态码：

```ts
throw new NotFoundException('user not found')
```

- 分页查询参数继承 `PageQuery`；分页结果直接返回 `PaginatedResponseBody`（拦截器会自动包装）：

```ts
return new PaginatedResponseBody(items, total, page, pageSize)
```

- **返回 `Response` 实例可以绕过包装**：拦截器只对"不是 `Response`"的返回值做包装。要自己控制响应体/头（流、文件、HTML）时必须返回真正的 `Response`（如 `new Response(file, { headers })`），返回 `BunFile` 之类会被 JSON 序列化掉

## WebSocket（`common/request/ws-request.ts` / `common/response/ws-response.ts`）

长连接只有一套帧，和 HTTP 的请求 / 响应**同构** —— 学一个就等于学两个：

| 方向 | 类 | 帧 |
| --- | --- | --- |
| 客户端 → 服务端 | `WsRequest` | `{ id: string \| null, event: string, data: unknown }` |
| 服务端 → 客户端 | `WsResponse` | `{ id: string \| null, event: string, code: number, message: string, data }` |

- `code` 与 HTTP 的 `ApiResponse` **同一套语义**：`0` 成功、其余是 `ApiException.code`，所以同一个 service 抛的异常在两种传输下说的是同一件事
- `event` 是事件名，`<feature>.<action>` 小写：`chat.send`、`terminal.input`；`ping` / `pong` 是**协议保留事件**，不要拿去当业务事件
- `id` 由客户端生成、服务端原样带回，一个连接上并发多个请求也能各回各家；客户端不需要回答时 `id` 是 `null`（单向通知），服务端主动推送的 `id` 也是 `null`
- 只走 **JSON 文本帧**，不支持二进制帧；二进制 / 非 JSON 的帧一律当非法帧处理

**帧的解析与构造只在 common 这一处**，handler 里不许手拼对象：

```ts
.ws('/api/ws', {
  open(ws) {
    ws.send(WsResponse.push('chat.message', { welcome: true }).toFrame())
  },
  message(ws, message) {
    // WS 边界是不可信输入：不是 JSON、缺 event、形状不对都从 parse 挡掉
    const request = WsRequest.parse(message)

    if (request === null) {
      ws.send(WsResponse.fail(null, new BadRequestException('invalid frame')).toFrame())
      return
    }

    if (request.event === 'ping') {
      ws.send(WsResponse.push('pong', null).toFrame())
      return
    }

    try {
      // 业务异常照抛（和 controller 里一样），由 fail 转成错误帧
      ws.send(WsResponse.ok(request, doSomething(request.data)).toFrame())
    } catch (error) {
      // ApiException 家族 → 用它自己的 code / message；其它 → 500，细节不外泄，只进日志
      if (!(error instanceof ApiException)) {
        LogService.error('chat', error)
      }
      ws.send(WsResponse.fail(request, error).toFrame())
    }
  },
})
```

- **解析失败不要抛异常、也不要静默**：回一帧 `WsResponse.fail(null, …)`，或者直接 `ws.close(1003)`（协议错误码）
- `WsRequest.parse<T>(frame)` 的泛型是**调用点的承诺而不是校验**：`data` 内部形状要严格校验就自己再收一道，和控制器里 `body as Partial<LoginDto>` 同一套写法
- `WsResponse.fail(request, error)`：`ApiException` 家族沿用它的 `code` / `message`，其它异常一律折成 `500 Internal Server Error` —— **不把内部错误发给客户端**，原始异常用 `LogService.error` 记下来（tag 用功能域名）
- **ping/pong 是协议的一部分**：前端客户端每 25s 发一帧 `{ event: 'ping' }`，连上没有其他流量时它靠 `pong` 判断连接还活着（两个周期收不到任何帧就主动断开重连），所以 ws 路由必须实现 `ping → pong`
- 升级请求的鉴权与 HTTP 完全一样（`authInterceptor` 覆盖 ws，`ws.data.auth` 就是当前用户），见「认证」；无 token 的升级会被直接拒绝
- 心跳、重连、请求应答这些都在前端 `web/src/api/websocket.ts` 里，服务端不要重复实现

## 数据库

- `DATABASE_TYPE` 支持 `sqlite` / `postgres` / `mysql`
- SQLite 路径使用 `path.resolve(process.cwd(), ...)`，避免 Windows 相对路径解析问题
- 当前 schema 留空，按需在 `src/db/schema.ts` 添加 Drizzle 表
- 不要在业务代码中直接创建连接，统一使用 `src/db/database.ts` 的 `db`
- 迁移脚本（`db:generate` / `db:migrate` / `db:studio`，在 `server/` 下运行）见 `CLAUDE.md` 的常用命令

## 应用标识与打包

### 应用标识

- 应用名称与版本号的**唯一来源**是仓库根目录的 `app.config.ts`（`APP_NAME` / `APP_VERSION`）。后端（`server/src/main.ts`）、前端（`web/src/pages/home.tsx`）、打包脚本（`scripts/compile.ts`）都**直接 import** 它，没有第二份拷贝、没有 `define`、没有环境变量
- 它是**构建时快照**：`bun build --compile` 出来的二进制旁边没有 `package.json`，值必须编译时内联，所以两端的值都是各自那次构建时的快照，**改了不重新构建不生效**
- 后端影响：启动日志 `bun-starter 0.1.0 — server is running at …`、`GET /health` → `{"status":"ok","name":…,"version":…}`
- `APP_NAME` 同时当显示名与产物文件名用，必须是小写短横线 slug（`bun-starter`）
- 根 `package.json` 的 `version` 是 npm 元数据，**与应用版本无关**
- 改版本号的完整流程、验证与排查见 **`.claude/skills/app-version/SKILL.md`**

### 打包：单文件 + 单端口

`bun run compile` = 前端 `vite build` + `bun build --compile --asset web/dist`，产出 `dist-bin/<name>-<version>-<platform>`（5 个 target，靠 Bun 内嵌各平台 runtime 交叉编译，**不需要 gcc / zig**）。

- 产物把前端 `web/dist` 内嵌进去，由 `server/src/common/static/embedded-static.ts` 在启动时从 `Bun.embeddedFiles` 里读出来自己服务 —— 因此整个应用只占**一个端口**，不需要 node_modules、不需要 bun、不需要单独的前端服务器
- 该插件在 `Bun.embeddedFiles` 为空时（即 `bun run dev`）退化成空插件，dev 下前端仍由 vite 提供，行为不变
- `--asset` 前端的路径前缀由 `index.html` 那条记录反推，别写死
- 静态路由**必须返回真正的 `Response`**（见「请求 / 响应」最后一条），否则会被包装成 JSON
- 客户端路由（如 `/login`）在服务端是未知路径，会回退到内嵌的 `index.html`；`/api/*` 的未知路径仍是 404

## `index.ts` 规范（与前端一致，硬性要求）

不禁止 `index.ts`，但必须严格控制它写什么。

**唯一正当用途：统一导出入口（纯 re-export）**

```ts
// index.ts —— 允许
export { UserController } from './user.controller'
export type { UserVo } from './vo/user.vo'
```

外部即可一行导入：

```ts
import { UserController } from './modules/user'
```

**禁止把实现写进 `index.ts`**

```ts
// index.ts —— 禁止
export class UserController { /* 业务逻辑 */ }
export function formatDate() { /* 工具函数 */ }
export const config = { /* 配置 */ }
export async function init() { /* 初始化 */ }
```

规则：

- `index.ts` **只做 re-export**，不得出现类、函数、常量、配置、初始化等任何实现
- 业务逻辑必须放在具体文件里，`index.ts` 只负责转发
- 具体文件之间一律直接 import（`import { UserVo } from './vo/user.vo'`），需要目录入口时才由 `index.ts` 统一导出
- 空白目录直接保留，**绝对不要**放 `.gitkeep` 之类占位文件

前端对 `index.ts` 的要求与这里完全一致（见 `.claude/rules/frontend.md`）。

## 代码风格

- TypeScript 严格模式（`strict` + `noUncheckedIndexedAccess`）、单引号、分号
- 类字段显式声明，避免 parameter properties（`erasableSyntaxOnly` 也禁止参数属性）
- 命名：文件与类使用 PascalCase / kebab-case
- 不提交 `dist/`、`data.db` 等构建/运行产物
- `tsconfig` 开了 `verbatimModuleSyntax`：只当类型用的 import 必须写 `import type`
