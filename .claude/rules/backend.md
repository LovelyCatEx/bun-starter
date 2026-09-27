---
description: 后端（server/）开发规范。写后端代码、加业务模块、动分层与依赖方向、写 controller/service/DTO/VO/拦截器、接数据库或迁移、加配置项、改打包产物时使用。涉及 server/src 的目录结构、common 与 modules 的依赖方向、Elysia 拦截器注册顺序、统一响应与异常、日志、应用标识与单端口打包、index.ts 与代码风格。长连接（WebSocket）与原生产物（C/C++）的细节已拆进 `.claude/skills/`，本文件只留硬性约束与指针。
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
shared/                       # 仓库根目录：两端共用的线上契约，禁止依赖任何一端（见「共享层」）
  protocol/                   # 与具体业务无关的传输契约
    api-response.ts           # CODE_OK / ApiResponse / PaginatedResponseBody
    page-query.ts             # PageQuery
    ws-request.ts             # WsRequest：客户端进来的 WS 帧（见「WebSocket」）
    ws-response.ts            # WsResponse：发给客户端的 WS 帧
    ws-events.ts              # WS_PING / WS_PONG
  <feature>/                  # 与业务模块同名：客户端也要用的 dto / vo
    dto/
    vo/

server/src/
  main.ts                   # 组合根：组装插件、注册模块、listen
  common/                   # 通用能力，禁止依赖 modules/
    config.ts               # Zod env + Config 类
    response/
      ws-failure.ts         # 服务端的异常 → WS 错误帧（见「WebSocket」）
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
        dto/                # 【必须有】只服务端用的请求 DTO（共享的放 shared/<feature>/dto/）
        vo/                 # 【必须有】只服务端用的响应 VO（共享的放 shared/<feature>/vo/）
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
modules/<feature>   # 业务模块：可以依赖 common / shared 与自身内部文件
  ↓
common              # 通用能力：config / response / exception / interceptor
  ↓
shared/             # 两端共用的契约：谁都能 import 它，它谁都 import 不了
```

- **`common/**` 绝对不可以 import `src/modules/**`**。一旦某个"通用"文件需要用到具体业务模块，说明它本身就属于那个模块，应该搬进 `src/modules/<feature>/`。例：认证拦截器在 `modules/auth/interceptor/auth.interceptor.ts`，**不在** `common/interceptor/`
- 模块之间不要互相 import；确实要复用就先下沉到 `common`
- 模块自己的东西一律留在模块内：装配入口 `modules/<feature>/<feature>.plugin.ts` 放模块根目录，拦截器放 `modules/<feature>/interceptor/` 包（见下）
- 反向依赖的判定标准很简单：`grep -rn "modules/" server/src/common/` 必须没有输出
- 依赖方向里多了一层 `shared/`（仓库根目录），它是**最底下那一层**：两端都 import 它，它谁都不 import。边界与硬规则见「共享层」

### 模块内的结构

一个模块 = `server/src/modules/<feature>/`，内部**按职责分包**，不要写成散落在模块根目录的文件：

| 包 / 文件 | 必选 | 职责 |
| --- | --- | --- |
| `controller/<feature>.controller.ts` | 是 | 只做路由定义（`new Elysia().group('/api', ...)` 或 `{ prefix }`）与参数校验，转调 service |
| `controller/dto/` | 是（目录） | **只服务端用**的请求 DTO，`*.dto.ts`；客户端也要用的放 `shared/<feature>/dto/` |
| `controller/vo/` | 是（目录） | **只服务端用**的响应 VO，`*.vo.ts`；客户端也要用的放 `shared/<feature>/vo/` |
| `service/<feature>.service.ts` | 是 | 业务逻辑，返回业务数据；失败抛 `ApiException` 家族 |
| `entity/` | 是（目录） | **唯一含义是某张数据表的记录对象**（Drizzle 表 / ORM entity），没有对应表就留空 |
| `provider/` | 按需 | 可替换实现的接口 + 内置默认实现（如 `AuthProvider` / `InMemoryAuthProvider`） |
| `interceptor/` | 按需 | 模块自己的 Elysia 拦截器，`*.interceptor.ts`；**是一层包，可以放多个拦截器** |
| `<feature>.plugin.ts` | 按需 | 模块装配入口（工厂 / 注入点），返回可直接 `.use()` 的 Elysia 实例，放模块根目录 |

规则：

- 必选包与 `dto/` / `vo/` 目录**即使为空也必须保留**，并且**绝对不要**放 `.gitkeep` 之类的占位文件
- **拦截器是包不是文件**：写 `modules/auth/interceptor/auth.interceptor.ts`，不要写成 `modules/auth/auth.interceptor.ts`
- 拦截器用 `new Elysia({ name: '<feature>-xxx' })` 声明，需要全应用生效时给 hook 加 `{ as: 'global' }`，并在 `main.ts` 里于控制器**之前** `.use()`（Elysia 的 hook 只对注册之后的路由生效）
- **DTO / VO 放哪边**：客户端也要用的（响应里出现的形状、请求体形状）放 `shared/<feature>/`，只服务端用的留 `controller/dto|vo`。判断标准就一句：**这个字段形状要不要出现在 `web/` 里**；两边都写一份是本仓库明确要避免的事
- **共享的 DTO / VO 都是类，构造函数只吃自己的字段**（`new AuthUserVo(id, username, name)`），不允许出现 `new AuthUserVo(authUser)` 这种吃内部模型（provider / entity / 数据库行）的适配构造 —— 那个模型前端根本没有，写进去就没法共享了。内部模型 → VO 的映射写在调用点（controller），一行一个字段
- 只服务端的 DTO / VO 同样是类；`strictPropertyInitialization` 下要么用构造函数赋值，要么对纯形状 DTO 用 `name!: string`，否则会报 TS2564
- 新功能模块放在 `src/modules/<feature>/`，在 `src/main.ts` 中注册

### 新模块示例

```ts
// src/modules/user/controller/dto/list-users.query.dto.ts
// 只服务端用的请求形状（客户端不传这些内部筛选参数）：留在 controller/dto，不用构造 →
// strictPropertyInitialization 下写 `!`
export class ListUsersQueryDto {
  keyword!: string
}

// shared/user/dto/create-user.dto.ts —— 客户端也要发的请求体，放共享层（纯字段构造）
export class CreateUserDto {
  name: string
  email: string

  constructor(name: string, email: string) {
    this.name = name
    this.email = email
  }
}

// shared/user/vo/user.vo.ts —— 响应里出现的形状，同样在共享层
export class UserVo {
  id: string
  name: string
  email: string

  constructor(id: string, name: string, email: string) {
    this.id = id
    this.name = name
    this.email = email
  }
}

// src/modules/user/controller/user.controller.ts
import { Elysia } from 'elysia'

import { UserVo } from '@shared/user/vo/user.vo'

import { UserService } from '../service/user.service'

export class UserController {
  private readonly service = new UserService()

  get routes() {
    return new Elysia({ prefix: '/api/user' })
      .get('/', async () => {
        const users = await this.service.list()

        // 内部模型 → 共享 VO 的映射写在调用点，一行一个字段
        return users.map((user) => new UserVo(user.id, user.name, user.email))
      })
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

## 共享层（仓库根目录 `shared/`）

两端**共用同一份代码**的线上契约。以前是两份手抄的形状（`ApiResponse`、WS 帧、DTO/VO 各一份），抄错一边的症状是"类型都对、跑起来解不开包"，所以这部分只留一份。

- 分两半：`shared/protocol/` 是与业务无关的传输契约（信封、分页、WS 帧、保留事件名），`shared/<feature>/` 是每个业务模块的 dto / vo，**目录名与后端模块同名**
- import 一律用 `@shared/...` 别名：后端走 `server/tsconfig.json` 的 `paths`，前端走 `web/vite.config.ts` 的 `resolve.alias` **加上两个 tsconfig**（`tsconfig.app.json` 给 `tsc`，`tsconfig.json` 给 Bun / vite 这类按 tsconfig 解析的运行时 —— 只改一个的症状是"typecheck 过了、跑起来 Cannot find module"）
- **`shared/` 里禁止出现**：`node:*` / `bun` / `@elysiajs/*` / `elysia` / `react` / DOM API、`process.env`、`fetch` / `localStorage`、任何一端独有的东西。它必须是最底层：**谁都 import 得动它，它谁都 import 不了**
- 内容只有两种：**纯类型 / 纯数据类**（字段 + 参数构造 + 无依赖的小工具方法，如 `toFrame()` / `totalPages`），以及**常量**（`CODE_OK`、`WS_PING`）。别把配置、日志、异常体系搬进来 —— `ApiException`、`LogService`、`config` 是服务端的概念，前端永远不会用到
- 副作用是"异常不认识 code"：共享的 `WsResponse` 只收 `code` / `message`，把 `ApiException` 翻成这两个值的映射留在服务端（`common/response/ws-failure.ts`）。以后加共享类型时也会遇到同样的分界线，往这边靠
- **风格跟 `app.config.ts`**：单引号 + 分号（后端风格），字段显式声明，不用 `enum` / 参数属性
- **严格度按最严的那份**：`shared/` 同时被 server（`strict` + `noUncheckedIndexedAccess`）和 web（宽松）编译，所以按 server 的规矩写 —— 反过来会出现"web 能过、server 报错"
- 改 `shared/` 必须跑两端：`cd server && bun run typecheck` + `cd web && bun run typecheck && bun run lint`，并至少验一次 `vite build`（前端要能把共享代码打进 bundle）
- 共享层里**不要**再出现"镜像类型"（`interface` 版 + `class` 版各一个），一份就是一份

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

## 请求 / 响应（契约在 `shared/protocol/`）

- 控制器 handler **直接返回业务数据**，不要手动包 `ApiResponse`
- 信封类是两端共用的 `@shared/protocol/api-response`，成功响应由 `responseInterceptor` 统一包装为：

```json
{ "code": 0, "message": "ok", "data": "业务数据" }
```

- 判断成功**只用 `CODE_OK`**（同一个文件里导出），不要写 `0` 字面量：前端 `unwrap` 也在用同一个常量，两边各写一遍就是"永远解不开包"的隐患
- 失败时**抛异常**，由拦截器统一转为 `ApiResponse` 并设置 HTTP 状态码：

```ts
throw new NotFoundException('user not found')
```

- 分页查询参数用 `@shared/protocol/page-query` 的 `PageQuery`；分页结果直接返回 `@shared/protocol/api-response` 的 `PaginatedResponseBody`（拦截器会自动包装）：

```ts
return new PaginatedResponseBody(items, total, page, pageSize)
```

- **返回 `Response` 实例可以绕过包装**：拦截器只对"不是 `Response`"的返回值做包装。要自己控制响应体/头（流、文件、HTML）时必须返回真正的 `Response`（如 `new Response(file, { headers })`），返回 `BunFile` 之类会被 JSON 序列化掉

## WebSocket（长连接）

长连接**和 HTTP 同构**：帧是共享的（`@shared/protocol/ws-*`），`code` 与 `ApiResponse` 同一套语义（`CODE_OK` / 异常 code），同一份 service 抛的异常在两种传输下说的是同一件事 —— 学一个等于学两个。要点：

- 事件名 `<feature>.<action>` 小写（`chat.send`）；心跳用共享常量 `WS_PING` / `WS_PONG`，不要拿它当业务事件
- `id` 由客户端生成、服务端原样带回，服务端主动推送与单向通知是 `null`；只走 JSON 文本帧
- **每个 ws 路由必须实现 `WS_PING → WS_PONG`**：前端 25s 一次心跳，靠它判断连接还活着
- 帧的解析与构造只在共享层这一处（`WsRequest.parse` / `WsResponse.ok|push`），错误帧一律经 `wsFailure()`；**解析失败不要抛异常、也不要静默**
- 鉴权与 HTTP 完全一样（`authInterceptor` 覆盖 ws，所以必须挂在 `/api/*` 下）；前端的心跳 / 重连 / 请求应答都在 `web/src/api/websocket.ts`，服务端不要重复实现

加一条长连接业务、广播 / 订阅、前端接推送与组件侧用法、排查（连不上 / send 超时 / 一直重连 / 被 401 挡在升级）→ **`.claude/skills/websocket/SKILL.md`**

## 数据库

- `DATABASE_TYPE` 支持 `sqlite` / `postgres` / `mysql`；SQLite 路径按 `process.cwd()` 解析，换目录启动会换掉读到的 `.env` 与落库位置
- schema 写在 `src/db/schema.ts`（当前留空）；**不要自己连库**，统一用 `src/db/database.ts` 的 `db`
- **启动即把迁移跑到最新**：`createDatabase()` 里三种方言各调自己的 `migrate()`。没有迁移（schema 还空着，或编译那个产物时还没 `db:generate`）就跳过并打一行 debug —— 空库启动是脚手架的常态；**但迁移执行失败要把异常抛出去**，schema 不对的进程不该开始收请求
- `main.ts` 里那句 `import './db/database'` 是**副作用 import，别删**：迁移必须赶在第一个请求之前跑完，不能等某个业务模块第一次 import `db`（业务模块只用 `schema.ts` 拿表定义时，`db` 可能一直没人 import）
- 迁移目录 dev 读磁盘上的 `server/drizzle`、产物读 `--asset` 内嵌的那份，内嵌与查找的规矩见「打包」
- 脚本 `db:generate` / `db:migrate` / `db:studio`（在 `server/` 下跑）见 `CLAUDE.md` 常用命令；`db:migrate` 是给"手动 / CI 里先迁移"用的，跑起来那份应用自己也会迁移

## 应用标识与打包

### 应用标识

应用名称与版本号的**唯一来源**是仓库根 `app.config.ts`（`APP_NAME` / `APP_VERSION`），后端、前端、打包脚本都**直接 import** 它，没有第二份拷贝、没有 `define`、没有环境变量。`APP_NAME` 同时当显示名与产物文件名，必须是小写短横线 slug（`bun-starter`）；根 `package.json` 的 `version` 是 npm 元数据，**与应用版本无关**。

改版本号的完整流程、验证与排查（"改了没生效""产物名没变""前端没更新"）→ **`.claude/skills/app-version/SKILL.md`**

### 打包：单文件 + 单端口

`bun run compile` = 前端 `vite build` + 每个 target 编一份原生产物 + `bun build --compile`，产出 `dist-bin/<name>-<version>-<platform>`（5 个 target，靠 Bun 内嵌各平台 runtime 交叉编译）。

`--asset` 有三个来源：

- **前端 `web/dist`** —— 由 `server/src/common/static/embedded-static.ts` 启动时从 `Bun.embeddedFiles` 里读出来自己服务，所以整个应用只占**一个端口**，不需要 node_modules、不需要 bun、不需要单独的前端服务器；该插件在 `Bun.embeddedFiles` 为空时（即 `bun run dev`）退化成空插件，dev 下前端仍由 vite 提供
- **迁移 `server/drizzle`** —— 二进制旁边没有它可读，而服务端**启动就要迁移**（见「数据库」）。还没 `db:generate` 过就只警告、不加这个 `--asset`，让空 schema 的脚手架照样能打包
- **每个 target 自己的原生 helper** —— 见「原生产物（C / C++）」

**目录**（前两个）的内嵌名字只看 basename：实测 `web/dist` → `dist/…`、`server/drizzle` → `drizzle/…`，父级路径全丢 —— 所以读目录要**从 `Bun.embeddedFiles` 反推**（`index.html` / `meta/_journal.json` 那几条记录），别凭直觉写 `import.meta.dir/drizzle`。**单个文件**（helper）同样只留 basename，于是干脆按名字写死去找。两条路别混用。

**前两个不需要任何工具链，只有原生 helper 需要** clang / zig —— 仓库里 `server/native/` 没有 `.c` / `.cpp` 时，整条链路跟以前一样零依赖。

- 静态路由**必须返回真正的 `Response`**（见「请求 / 响应」最后一条），否则会被包装成 JSON
- 客户端路由（如 `/login`）在服务端是未知路径，会回退到内嵌的 `index.html`；`/api/*` 的未知路径仍是 404
- `scripts/compile.ts` 是**根目录的文件**，由根 `tsconfig.json` 检查（`types: ["bun"]` 已经带上 `node:*` 与 Bun 全局）；新增根目录 TS 文件要加进那份 `include`。三条命令各自解析 `@shared/*`：`bun run`（cwd=server）、`bun build src/main.ts`（按入口文件最近的 `server/tsconfig.json`）、`vite build`（按 `web/vite.config.ts` 的 alias）—— 改别名配置时这三条都要能过

### 原生产物（C / C++）

需要一段原生程序时（真 PTY、系统调用、现成的 C/C++ 库、性能热点）：`server/native/<name>.c` 编出来就叫 `<name>`（Windows 上是 `<name>.exe`），**5 个平台的产物里同名内嵌**，运行时按名字从 `Bun.embeddedFiles` 里取出来、抽到磁盘再跑。dev 有编译器就从源码编（mtime 缓存），产物没有编译器就抽内嵌那份 —— 一个入口两种来源，调用方不需要知道自己在哪。

- 名字是唯一约定，三处必须一致：`server/native/<name>.c` ↔ `NATIVE_HELPERS` 里的一行 ↔ `runNativeHelper('name')`。对不上直接报错，不会静默退化
- 缺工具链或编译失败 → **整个 target 跳过**（不静默发一个"原生能力一跑就报错"的产物）；仓库里没有 `.c` / `.cpp` 时默认链路依旧**零工具链**（前端与迁移不需要 gcc / zig）
- ⚠️ **资源进产物 ≠ 读取端进产物**：`--asset` 是显式的，helper 一定在内；读它的代码要有人 import，否则会被 tree-shake（和「数据库」里 `db` 那个坑同理）

选进程还是 `bun:ffi`、写与接入、三层调用 API、工具链与体积、抽取语义、排查与验证套路 → **`.claude/skills/native-helper/SKILL.md`**

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
- import 顺序：外部依赖 → `@shared/` → 内部相对路径（`@shared` 是仓库根的共享契约，比"同一个包里的文件"更远，所以排在前面）
- 类字段显式声明，避免 parameter properties（`erasableSyntaxOnly` 也禁止参数属性）
- 命名：文件与类使用 PascalCase / kebab-case
- 不提交 `dist/`、`data.db` 等构建/运行产物
- `tsconfig` 开了 `verbatimModuleSyntax`：只当类型用的 import 必须写 `import type`
- **别用 `Bun.readableStreamToText`**（已 deprecated，让用 `ReadableStream#text()`）：`.text()` 运行时确实有，但类型上只有 `stream/web` 的 `ReadableStream` 被补了这个方法，子进程 stdout / stderr 拿到的是全局那个。读管道/流就写 `new Response(stream).text()` —— 同一个读法、类型齐全、不碰 deprecated（`server/src/common/native/native-helper.ts` 的 `readText` 就是它）
