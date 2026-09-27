# CLAUDE.md

本文件为 Claude（claude.ai）在此仓库工作时的项目说明与开发规范。

**具体规范按端拆开，本文件只做总览与索引。**

## 项目概览

Bun monorepo 脚手架：

- `server/` — 后端（Bun + Elysia + Drizzle ORM + Drizzle Kit + Zod）
- `web/` — 前端（Vite + React + React Router + Tailwind CSS + shadcn/ui + react-i18next）

默认端口：

- 后端：`5107`
- 前端：`5108`（开发时 `/api/*` 代理到后端）

## 目录结构

```
bun-starter/
  app.config.ts         # 应用名称 / 版本的唯一来源，前后端都直接 import
  tsconfig.json         # 只覆盖根目录工具链（app.config.ts + scripts/）—— 见「常用命令」
  shared/               # 前后端共用的线上契约（信封 / WS 帧 / 各模块 dto、vo），见 .claude/rules/shared.md
  scripts/compile.ts    # 打包：前端 vite build + 每个 target 编原生产物 + bun build --compile → dist-bin/
  scripts/native-helper.ts   # 交叉编译 server/native/*.c（macOS 用 clang、其余用 zig），见 .claude/rules/packaging.md 与 .claude/skills/native-helper/SKILL.md
  scripts/build-targets.ts   # 5 个交叉编译目标 + 每个目标编译原生件要知道的（架构 / triple / 扩展名）
  server/               # 后端（单包 + 内部功能域文件夹）
  server/native/        # 需要原生程序时放这里（文件名 = helper 名字），现在是可删的样例
  web/                  # 前端
  .claude/
    rules/              # 按 paths 自动加载：backend / frontend / shared / auth / database / packaging
    skills/             # app-version / frosted-glass / background-image / websocket / native-helper
```

## 常用命令

```bash
bun install
bun run dev          # 并行启动 server + web
bun run dev:server   # 只启动后端
bun run dev:web      # 只启动前端
bun run build        # 构建 server + web
bun run compile      # 构建前端 + 打包成 dist-bin/ 下的自包含可执行文件（内嵌前端 + Drizzle 迁移 + 原生 helper）
bun run typecheck    # 类型检查全部 workspace，外加根目录工具链（tsc --noEmit 用根 tsconfig.json）
```

**三个 program 各管一片**，别把它们混起来：

| program | 覆盖 | 配置 |
| --- | --- | --- |
| `server` | `server/src`、`drizzle.config.ts`、`shared/` | `server/tsconfig.json` |
| `web` | `web/src`、`shared/` | `web/tsconfig.app.json`（+ `tsconfig.json` 给运行时/工具读） |
| 根目录 | `app.config.ts`、`scripts/` | 根 `tsconfig.json` |

`tsc` 和编辑器是**按文件往上找最近的 `tsconfig.json`** 来定的：根目录那些文件以前一个 config 都没有，所以 `scripts/compile.ts` 里的 `node:fs/promises` / `Bun` / `process` 会报 TS2591 / TS2868（"要不要装 @types/node"）—— 根 `tsconfig.json` 就是为此存在的（`types: ["bun"]` 已经带上 node 内置模块与 Bun 全局，别再装 `@types/node`）。**新增根目录的 TS 文件要加进它的 `include`**。

后端数据库脚本（在 `server/` 下运行）：

```bash
bun run db:generate  # 生成 Drizzle 迁移（server/drizzle/）
bun run db:migrate   # 手动执行迁移（CI 里用；应用启动时自己也会迁移）
bun run db:studio    # 打开 Drizzle Studio
```

迁移目录 `server/drizzle` 会被 `bun run compile` 内嵌进可执行文件：产物启动时就把库迁移到最新，
旁边没有这个目录也能跑。没有迁移（schema 还空着）时打包会警告一句、二进制启动时跳过迁移 —— 都是正常的。

## 规范索引

**规范按"常驻 + 按路径加载"拆开**，改哪边的文件就加载哪几份：

| rule | 作用域（frontmatter `paths`） | 装什么 |
| --- | --- | --- |
| `.claude/rules/backend.md` | `server/**`、`.env.example` | 分层与依赖方向、模块内结构、请求 / 响应、日志、配置、`index.ts`、代码风格；**专题只留指针** |
| `.claude/rules/frontend.md` | `web/**` | 结构与别名、请求规范、认证、文案（i18n）、样式与主题、配置、`index.ts`、代码风格 |
| `.claude/rules/shared.md` | `shared/**` | `shared/` 的边界与禁止清单、风格与严格度、改完必须跑两端 |
| `.claude/rules/auth.md` | `server/src/modules/auth/**`、`server/docs/auth-provider.md` | `AuthProvider` 唯一扩展点、JWT 与两种传输、WS 升级的鉴权口子 |
| `.claude/rules/database.md` | `server/src/db/**`、`server/drizzle.config.ts`、`server/drizzle/**` | 方言、启动即迁移、迁移目录在 dev 与产物里的两种来源 |
| `.claude/rules/packaging.md` | `scripts/**`、`app.config.ts`、`server/src/common/static/**`、`server/src/main.ts` | 单文件 + 单端口、三个 `--asset` 来源、内嵌命名规矩、应用标识 |

**为什么不合成一份**：rule 一旦被加载就是常驻上下文，而"改 `scripts/compile.ts`"和"写一个 service"要读的东西几乎不重叠。拆开与否的判据是 **`paths` 能不能划开**：`shared/**`、`server/src/db/**`、`scripts/**` 能划开；"带 ws 路由的 controller"划不开（ws 路由就写在普通 controller 文件里），所以长连接留在 `backend.md` 的硬约束 + `websocket` skill 里。

- **rule 的 frontmatter 只认 `paths`**（YAML 列表，支持 glob 与 `{a,b}`），别写成 skill 的 `name` / `description`
- 划不开的窄专题走 **skill**（按 description 匹配、用到才读）：`app-version` / `websocket` / `native-helper` / `frosted-glass` / `background-image`
- 细则**别抄回 `backend.md`**：它对整个 `server/**` 生效，抄进去就是每读一个后端文件都要付的上下文 —— `backend.md` 顶部有张「想做什么，读哪份」的路由表

**专题 skill**（涉及对应改动时先读）：

- 改应用名称 / 版本号 → `.claude/skills/app-version/SKILL.md`
- 毛玻璃（`frosted:`）组件样式 → `.claude/skills/frosted-glass/SKILL.md`
- 背景图（`bgimage:`）组件样式 → `.claude/skills/background-image/SKILL.md`
- 长连接（WebSocket）：加事件、写 ws 路由、组件里接推送 → `.claude/skills/websocket/SKILL.md`
- 原生产物（C / C++）：把 .c/.cpp 编进 5 个平台产物、dev 与产物里都能跑、进程 vs `bun:ffi` → `.claude/skills/native-helper/SKILL.md`
