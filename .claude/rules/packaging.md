---
description: 打包与标识规范。改 `scripts/compile.ts`、动打包产物、加内嵌资源（前端 / 迁移 / 原生 helper）、改应用名称与版本号时使用。含单文件单端口、三个 --asset 来源、内嵌路径的取名规矩、原生产物入口。
paths:
  - "scripts/**"
  - "app.config.ts"
  - "server/src/common/static/**"
  - "server/src/main.ts"
---

## 应用标识与打包

### 应用标识

应用名称与版本号的**唯一来源**是仓库根 `app.config.ts`（`APP_NAME` / `APP_VERSION`），后端、前端、打包脚本都**直接 import** 它，没有第二份拷贝、没有 `define`、没有环境变量。`APP_NAME` 同时当显示名与产物文件名，必须是小写短横线 slug（`bun-starter`）；根 `package.json` 的 `version` 是 npm 元数据，**与应用版本无关**。

改版本号的完整流程、验证与排查（"改了没生效""产物名没变""前端没更新"）→ **`.claude/skills/app-version/SKILL.md`**

### 打包：单文件 + 单端口

`bun run compile` = 前端 `vite build` + 每个 target 编一份原生产物 + `bun build --compile`，产出 `dist-bin/<name>-<version>-<platform>`（5 个 target，靠 Bun 内嵌各平台 runtime 交叉编译）。

`--asset` 有三个来源：

- **前端 `web/dist`** —— 由 `server/src/common/static/embedded-static.ts` 启动时从 `Bun.embeddedFiles` 里读出来自己服务，所以整个应用只占**一个端口**，不需要 node_modules、不需要 bun、不需要单独的前端服务器；该插件在 `Bun.embeddedFiles` 为空时（即 `bun run dev`）退化成空插件，dev 下前端仍由 vite 提供
- **迁移 `server/drizzle`** —— 二进制旁边没有它可读，而服务端**启动就要迁移**（见 `.claude/rules/database.md`）。还没 `db:generate` 过就只警告、不加这个 `--asset`，让空 schema 的脚手架照样能打包
- **每个 target 自己的原生 helper** —— 见「原生产物（C / C++）」

**目录**（前两个）的内嵌名字只看 basename：实测 `web/dist` → `dist/…`、`server/drizzle` → `drizzle/…`，父级路径全丢 —— 所以读目录要**从 `Bun.embeddedFiles` 反推**（`index.html` / `meta/_journal.json` 那几条记录），别凭直觉写 `import.meta.dir/drizzle`。**单个文件**（helper）同样只留 basename，于是干脆按名字写死去找。两条路别混用。

**前两个不需要任何工具链，只有原生 helper 需要** clang / zig —— 仓库里 `server/native/` 没有 `.c` / `.cpp` 时，整条链路跟以前一样零依赖。

- 静态路由**必须返回真正的 `Response`**（见 `.claude/rules/backend.md` 的「请求 / 响应」最后一条），否则会被包装成 JSON
- 客户端路由（如 `/login`）在服务端是未知路径，会回退到内嵌的 `index.html`；`/api/*` 的未知路径仍是 404
- `scripts/compile.ts` 是**根目录的文件**，由根 `tsconfig.json` 检查（`types: ["bun"]` 已经带上 `node:*` 与 Bun 全局）；新增根目录 TS 文件要加进那份 `include`。三条命令各自解析 `@shared/*`：`bun run`（cwd=server）、`bun build src/main.ts`（按入口文件最近的 `server/tsconfig.json`）、`vite build`（按 `web/vite.config.ts` 的 alias）—— 改别名配置时这三条都要能过

### 原生产物（C / C++）

需要一段原生程序时（真 PTY、系统调用、现成的 C/C++ 库、性能热点）：`server/native/<name>.c` 编出来就叫 `<name>`（Windows 上是 `<name>.exe`），**5 个平台的产物里同名内嵌**，运行时按名字从 `Bun.embeddedFiles` 里取出来、抽到磁盘再跑。dev 有编译器就从源码编（mtime 缓存），产物没有编译器就抽内嵌那份 —— 一个入口两种来源，调用方不需要知道自己在哪。

- 名字是唯一约定，三处必须一致：`server/native/<name>.c` ↔ `NATIVE_HELPERS` 里的一行 ↔ `runNativeHelper('name')`。对不上直接报错，不会静默退化
- 缺工具链或编译失败 → **整个 target 跳过**（不静默发一个"原生能力一跑就报错"的产物）；仓库里没有 `.c` / `.cpp` 时默认链路依旧**零工具链**（前端与迁移不需要 gcc / zig）
- ⚠️ **资源进产物 ≠ 读取端进产物**：`--asset` 是显式的，helper 一定在内；读它的代码要有人 import，否则会被 tree-shake（和 `.claude/rules/database.md` 里 `db` 那个坑同理）

选进程还是 `bun:ffi`、写与接入、三层调用 API、工具链与体积、抽取语义、排查与验证套路 → **`.claude/skills/native-helper/SKILL.md`**
