---
description: 共享层（仓库根目录 `shared/`）规范。改 shared/protocol、给某个 feature 加 dto / vo、动两端共用的契约时使用。含边界与禁止清单、风格与严格度、改完必须跑两端的验证。
paths:
  - "shared/**"
---

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

## 两端各自的用法

- 后端：dto / vo 直接 import 自 `@shared/<feature>/…`，controller 里用 `body as XxxDto` 收一道；请求 / 响应与异常见 `.claude/rules/backend.md` 的「请求 / 响应」
- 前端：见 `.claude/rules/frontend.md` 的「共享层」（`import type` 的时机、不许在前端再抄一份 dto / vo）
