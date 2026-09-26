---
name: app-version
description: 修改应用名称 / 版本号（标识）的 Skill。当需要发新版本、改 APP_VERSION、改 APP_NAME、改打包产物名、给启动日志或页面加标识，以及排查"改了没生效""产物名没变""前端没更新"时使用。覆盖后端、前端与 `bun run compile` 产物命名。
---

# 应用标识（名称 / 版本）

**唯一来源是仓库根目录的 `app.config.ts`。改版本号就只改那一个文件。**

```ts
// app.config.ts
export const APP_NAME = 'bun-starter';
export const APP_VERSION = '0.1.0';
```

## 改一个值，会同时影响 5 个地方

| 位置 | 取值方式 | 什么时候生效 |
| --- | --- | --- |
| 后端启动日志 `bun-starter 0.1.0 — server is running at …` | `server/src/main.ts` 直接 `import` `app.config` | 重启后端 |
| `GET /health` → `{"status":"ok","name":…,"version":…}` | 同上 | 重启后端 |
| 首页卡片那一行 `bun-starter v0.1.0` | `web/src/pages/home.tsx` 直接 `import`，文案走 `t('home.version', { name, version })` | 重新 `vite build` 或重启 dev server |
| 打包产物文件名 `dist-bin/bun-starter-0.1.0-darwin-arm64` | `scripts/compile.ts` 直接 `import` | 重新 `bun run compile` |
| 前端 bundle 里内联的常量 | 由 `web/src/pages/home.tsx` 的 import 带进去 | 重新 `vite build` |

三者（后端 / 前端 / 打包脚本）都是**直接 import 同一个文件**，没有任何 `define`、没有环境变量、没有第二份拷贝。

## 为什么是 TS 模块，不是 `package.json`

`bun build --compile` 出来的二进制**旁边没有 `package.json`**（它可能被拷到任何地方单独运行）。所以版本号必须在**构建时**就内联进产物 —— 一个被 import 的 TS 模块正好是这件事：

- 后端：`bun build --compile` 把 `app.config.ts` 当普通模块打进二进制 → 产物里读到的是编译那一刻的值
- 前端：vite 把它当源码模块打包 → 值内联进 `dist/assets/index-*.js`

两边都是**构建时快照**，不是运行时读文件。这既让二进制自包含，也意味着**改了不重新构建就不会生效**（见「排查」）。

> 反过来，**不要**在 `server/` 里 `import pkg from '../../package.json'`，也不要在 `web/vite.config.ts` 里搞 `define: { __APP_VERSION__ }`。前者让"改哪一处"变模糊，后者平白多一层注入机制 —— 现在这套直接 import 在 dev 和 build 下都一样工作。

## 改版本号的完整流程

1. **改 `app.config.ts`** 里的 `APP_VERSION`（发版）或 `APP_NAME`（改名）。就这一处。
2. **前端文案不用动**。`home.version` 这句是 `'{{name}} v{{version}}'`，name / version 都是插值，不需要为了换版本去改语言文件。
3. **重新构建**：
   ```bash
   bun run typecheck     # 确认没写坏
   bun run compile       # 产出 dist-bin/<name>-<version>-<platform>
   ```
   只跑 dev 的话 `bun run dev` 就够了（两个 dev server 都是实时读源码）。
4. **确认**（见下节）。

### `APP_NAME` 的命名约束

它**同时当显示名和产物文件名**用，所以必须是小写短横线 slug（`bun-starter`）。

- ✅ `bun-starter`、`my-app`
- ❌ `Bun Starter`（带空格，产物名会裂开）、`BunStarter`（大写）、`bun_starter`（下划线）

要一个"好看的展示名"（`Bun Starter`）的话，那是另一件事：再导出 `APP_TITLE` 并只用于界面文案，**产物名继续用 `APP_NAME`**。别把两者合成一个值。

### 别改错地方

根 `package.json` 里也有个 `version`（workspace 包的 npm 元数据），**它跟应用版本无关**，改它不会影响产物名、日志、页面任何一处。要发版就改 `app.config.ts`。

## 验证

```bash
bun run typecheck
bun run compile
ls dist-bin/                      # 名字里直接看得到 <name>-<version>-<platform>
```

跑二进制（顺便证明"一个端口 + 标识"都在）：

```bash
APP_PORT=5199 ./dist-bin/bun-starter-0.1.0-darwin-arm64
# 启动日志第二行起应有：bun-starter 0.1.0 — server is running at http://localhost:5199
curl -s localhost:5199/health     # {"code":0,"message":"ok","data":{"status":"ok","name":"bun-starter","version":"0.1.0"}}
```

前端（版本是**内联进 bundle** 的，所以直接搜产物）：

```bash
bun run --filter web build
grep -o '0\.1\.0' web/dist/assets/index-*.js | head -1     # 有输出 = 版本进了前端
```

肉眼确认：`bun run dev` → http://localhost:5108 登录后首页卡片上那行 `<name> v<version>`。

## 排查

按出现的问题查：

1. **产物名还是旧的 / 二进制 `/health` 还是旧版本** → 没重新 `bun run compile`。
   `--compile` 是构建时快照，改了 `app.config.ts` 不重新打包，二进制里永远是旧值。这是设计如此，不是 bug。
2. **前端页面没变** → 前端也是构建时内联。dev 下 `app.config.ts` 在依赖图里，改完 Vite 会重载页面（`app.config.ts` 在 vite root 之外，被解析成 `/@fs/<repo>/app.config.ts`，靠 workspace root 的 `fs.allow` 放行，属正常）；生产必须重新 `vite build`，浏览器再强刷一次。
3. **产物文件名不对** → 检查 `APP_NAME` 里有没有大写 / 空格 / 下划线，以及是不是改到了根 `package.json` 而不是 `app.config.ts`。
4. **只有一边变了**（比如 `/health` 新了、页面还是旧的）→ 正常，两边各自在自己那次构建时取值：后端要重启（或重新 compile），前端要重新 build。
5. **`tsc` 报 `app.config.ts`「不在项目里」** → 它在 `web/`、`server/` 两个 workspace 之外。现在两端都是靠 import 把它带进各自的项目（`include` 里没有它也能编过）。真出问题就在对应 `tsconfig` 的 `include` 里加上这个相对路径（`"include": ["src", "../app.config.ts"]` / `["src", "drizzle.config.ts", "../app.config.ts"]`），别改成复制一份值。
6. **想加新标识**（如 `APP_BUILD`、`APP_COMMIT`）→ 加在 `app.config.ts`，再按上表把用到的地方接上；加完检查第 4 条那个"两边都要重新构建"。

## 加一个新的展示位（比如登录页也显示版本）

1. 组件里 `import { APP_NAME, APP_VERSION } from '../../../app.config'`（注意层级：`web/src/pages/x.tsx` → `../../../app.config`）；相对 import 排在 `@/` 别名 import **之后**，空一行。
2. 文案**必须**走 i18n：在**每个**语言文件里成套加 key（`web/src/i18n/<域>/<页面>/{en-us,zh-cn}.ts`），插值统一 `{{name}}` / `{{version}}`，然后 `t('<域>.<页面>.version', { name: APP_NAME, version: APP_VERSION })`。
   规则见 `.claude/rules/frontend.md` 的「文案（i18n）」—— 少加一个语言就会 `t()` 直接返回 key 本身。
3. 不要把 `APP_NAME` / `APP_VERSION` 写死进组件，也不要写死 `'0.1.0'`。
