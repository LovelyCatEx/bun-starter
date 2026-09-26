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
  shared/               # 前后端共用的线上契约（信封 / WS 帧 / 各模块 dto、vo），见 .claude/rules/backend.md「共享层」
  scripts/compile.ts    # 打包：前端 vite build + bun build --compile → dist-bin/
  server/               # 后端（单包 + 内部功能域文件夹）
  web/                  # 前端
  .claude/
    rules/              # frontend.md / backend.md —— 前端与后端规范
    skills/             # app-version / frosted-glass / background-image
```

## 常用命令

```bash
bun install
bun run dev          # 并行启动 server + web
bun run dev:server   # 只启动后端
bun run dev:web      # 只启动前端
bun run build        # 构建 server + web
bun run compile      # 构建前端 + 打包成 dist-bin/ 下的自包含可执行文件
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
bun run db:generate  # 生成 Drizzle 迁移
bun run db:migrate   # 执行迁移
bun run db:studio    # 打开 Drizzle Studio
```

## 规范索引

**按端拆开的两个规范文件 —— 写对应侧代码前必须先读：**

- **后端** → `.claude/rules/backend.md`
  架构与分层依赖、共享层（`shared/` 的边界与禁止清单）、模块内结构、认证、配置、日志、请求/响应、WebSocket、数据库、应用标识与打包、`index.ts`、代码风格
- **前端** → `.claude/rules/frontend.md`
  结构与别名、共享层、请求规范、WebSocket、认证、文案（i18n）、样式与主题、配置、应用标识、`index.ts`、代码风格

两个 rule 都用 frontmatter 的 `paths` 限定作用域（`server/**` / `web/**`，另加 `app.config.ts` 等共享文件），只在该侧文件被读取时加载 —— **rule 的 frontmatter 只认 `paths`**（YAML 列表，支持 glob 与 `{a,b}`），别写成 skill 的 `name` / `description`。

**专题 skill**（涉及对应改动时先读）：

- 改应用名称 / 版本号 → `.claude/skills/app-version/SKILL.md`
- 毛玻璃（`frosted:`）组件样式 → `.claude/skills/frosted-glass/SKILL.md`
- 背景图（`bgimage:`）组件样式 → `.claude/skills/background-image/SKILL.md`
- 长连接（WebSocket）：加事件、写 ws 路由、组件里接推送 → `.claude/skills/websocket/SKILL.md`
