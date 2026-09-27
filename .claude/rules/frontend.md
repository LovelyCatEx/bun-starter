---
description: 前端（web/）开发规范。写前端代码、加页面/组件/请求、动样式与主题、加或改文案（i18n）、接认证时使用。涉及 web/src 的目录与 @ 别名、请求分层、react-i18next「目录即 key 前缀」的约定、Tailwind token 与四种颜色模式、应用标识、index.ts 与代码风格。
paths:
  - "web/**"
  - "app.config.ts"
---

# 前端规范（`web/`）

Vite + React + React Router + Tailwind CSS + shadcn/ui + react-i18next。默认端口 `5108`，开发时 `/api/*` 代理到后端 `5107`。

命令、端口、目录概览见 `CLAUDE.md`；后端侧的规范见 `.claude/rules/backend.md`。

## 结构与别名

- `@` 别名指向 `web/src`（`web/vite.config.ts` 的 `resolve.alias` + `tsconfig.app.json` 的 `paths`）
- `@shared` 别名指向仓库根的 `shared/`（两端共用的线上契约，见下）—— 它要在**三处**都配上：`vite.config.ts` 的 `resolve.alias`、`tsconfig.app.json` 的 `paths`（给 `tsc`）、`tsconfig.json` 的 `paths`（给按 tsconfig 解析的运行时，如 Bun 直接跑 web 代码）。只配一处或两处的症状是"typecheck 过了、跑起来 `Cannot find module '@shared/...'`"
- import 顺序：外部依赖 → `@shared/` → `@/` → 相对路径，之间空一行
- 每个后端模块对应前端一个同名包，放在 `web/src/api/<feature>/`：

```
web/src/api/
  requests.ts             # 原始请求层：doGet / doPost / doPut / doPatch / doDelete
  system-requests.ts      # 适配后端 ApiResponse 的通用封装：get / post / put / patch / del
  websocket.ts            # 长连接客户端（见「WebSocket」）
  <feature>/
    <feature>.ts          # 该模块的请求方法（dto / vo 从 @shared/<feature>/ 取，不再各写一份）
```

## 共享层（仓库根目录 `shared/`）

**两端共用的只有"线上契约"这一层**，不是把后端的 `common/` 搬过来 —— 后端的 config / 日志 / 异常 / 拦截器是服务端基础设施，前端也有自己的基础设施（`api/requests.ts`、`auth/token-store.ts`），这两堆都不共享。

- 分两半：`shared/protocol/` 是与业务无关的传输契约（`ApiResponse` + `CODE_OK`、`PageQuery`、WS 帧、`WS_PING` / `WS_PONG`），`shared/<feature>/` 是每个业务模块的 dto / vo，**目录名与 `web/src/api/<feature>/` 同名**
- 前端**只当类型用**就 `import type`（如 `AuthUserVo`、`WsResponse`），零运行时开销；确实要用到常量 / 类（`CODE_OK`、`WS_PING`）才值导入
- **不要在 `web/src/api/<feature>/` 里再写一份 dto / vo**，那是以前两份手抄形状的老做法：抄错一边的症状是"类型都对、跑起来解不开包"。要改形状就改 `shared/`，两端一起变
- 前端**不许**改 `shared/` 里的东西去迁就前端（比如用 `localStorage`、`window`、`fetch`）：它必须能在服务端跑。具体边界与禁止清单见 `.claude/rules/backend.md` 的「共享层」
- 改 `shared/` 之后要跑两端：`cd web && bun run typecheck && bun run lint`，以及 `bunx vite build`（证明共享代码能被打进 bundle）
- 共享层风格是**后端风格**（单引号 + 分号），前端不要去"顺手格式化"它 —— 一个文件被两端格式化工具来回改是没完的

## 请求规范

- `requests.ts` 是**原始请求层**，只提供 `doGet` / `doPost` / `doPut` / `doPatch` / `doDelete`，不处理业务响应结构
- `system-requests.ts` 在 `requests.ts` 之上**再封装**，方法名为朴素的 `get` / `post` / `put` / `patch` / `del`，自动解包后端 `ApiResponse`（信封与 `CODE_OK` 都是共享层那一份）
- 业务代码不要直接发请求，应写在对应模块包 `<feature>.ts` 里，开发者只填返回体 `data` 的类型即可：

```ts
import type { UserVo } from '@shared/user/vo/user.vo'
import type { CreateUserDto } from '@shared/user/dto/create-user.dto'

import { get, post } from '@/api/system-requests'

export function getUser(id: string) {
  return get<UserVo>(`/api/user/${id}`)
}

export function createUser(body: CreateUserDto) {
  return post<UserVo>('/api/user', body)
}
```

- 请求可以写根相对路径（`'/api/...'`）：开发时 vite 代理，单端口打包时同源，两种情况下都对

## WebSocket（`web/src/api/websocket.ts` + `web/src/hooks/use-websocket.ts`）

长连接的对应物，两个文件分工与 HTTP 侧一样：`websocket.ts` 是**传输层**（重连、心跳、请求应答、订阅都在这里，业务代码不要自己 `new WebSocket`），`hooks/use-websocket.ts` 是**组件里的入口**。

```tsx
const { connected, send } = useWebSocket({
  handlers: { 'chat.message': (message) => append(message) },
})

await send<ChatMessageVo>('chat.send', { text })
```

- **全应用共享一条连接**（`getWebSocketClient()`），多个组件同时 `useWebSocket()` 不会各开一条；要接第二个后端才 `new WebSocketClient({ path })`
- **挂载时自动连、卸载不断开**（别的组件可能还在用）。要断连就在该断的地方调 `getWebSocketClient().disconnect()`（退出登录、调试页开关），它会**停止重连**；反过来说，不调它就一定会自动重连
- `send(event, data)` 发请求等应答，失败 reject 一个 `WsError`：`code === WS_CLIENT_ERROR`（负数）是**客户端侧**失败（没连上 / 超时 / 连接断掉），其余是后端的 `code`（与 HTTP 的 `ApiException.code` 同一套）；`notify(event, data)` 是单向帧，不等应答
- **帧的类型来自共享层**（`@shared/protocol/ws-request` / `ws-response`），客户端不再自己声明 `WsFrame`；心跳用 `WS_PING` / `WS_PONG` 常量，不要写 `'ping'` 字面量。事件名与后端的 `event` 一字不差，`<feature>.<action>` 小写，业务不要占用心跳事件。心跳：默认每 25s 发一帧 `ping`，服务端回 `pong`，两个周期收不到任何帧就主动断开重连 —— 所以**后端 ws 路由必须实现 `ping → pong`**
- `useWebSocket({ handlers })` 的 `handlers` 可以内联写字面量：只在**事件名集合**变化时才重新订阅，处理函数走 ref 取最新闭包，不必自己 `useMemo`
- 认证不用管：cookie 模式浏览器自动带 cookie，localstorage 模式客户端自动拼 `?token=`（浏览器不能给 WS 加自定义头）。业务代码**不要**自己去读 token
- 业务方法写在 `api/<feature>/<feature>.ts` 里（和 HTTP 一样），内部用客户端收发，调用点只调业务方法
- 开发时 `/api` 代理的 `ws: true` 在 `web/vite.config.ts` 里，删了 WS 升级请求就停在 vite 上（表现是连不上、后端毫无反应）

后端侧（帧结构、`WsRequest` / `WsResponse`、parse 与错误帧）见 `.claude/rules/backend.md` 的「WebSocket」一节。

## 认证（`web/src/auth/`）

- 认证方式由 **`web/.env` 的 `VITE_AUTH_MODE`** 决定：`cookie`（默认）| `localstorage`，非法或缺省时回退 `cookie`（见 `web/src/auth/auth-mode.ts`）
- token 读写只走 `web/src/auth/token-store.ts`；**cookie 模式下三个方法都是 no-op**（JS 读不到 httpOnly cookie），登录态只能靠 `GET /api/auth/me` 判断
- 请求头与 401 只在 `web/src/api/requests.ts` 一处处理：自动挂 `Authorization`（localstorage 模式）、`credentials: 'include'`、401 触发 `setUnauthorizedHandler`（登录接口除外）
- 登录相关的形状来自共享层：`LoginDto` / `LoginVo` / `AuthUserVo` 在 `@shared/auth/{dto,vo}/`（`AuthUserVo` 是"能出现在响应里的那几个字段"，**不是**后端的 `AuthUser` 内部模型）
- 登录态与守卫：`auth-provider.tsx`（挂载时 `getMe` 判定）→ `useAuth()` → `require-auth.tsx`，受保护路由包在 `<Route element={<RequireAuth />}>` 里；`AuthProvider` 必须放在 `BrowserRouter` **内部**（要用 `useNavigate`）
- 业务代码不要自己读 token、也不要自己处理 401

后端侧（JWT、cookie、放行清单）见 `.claude/rules/backend.md` 的「认证」一节。

## 文案（i18n）

一句话：**目录就是 key 前缀，一个文件一种语言，语言文件里不许出现第二种语言。**

### 目录结构

```
web/src/i18n/
  languages.ts              # LANGUAGES + DEFAULT_LANGUAGE，唯一的语言清单
  config.ts                 # 装配：import.meta.glob 扫语言文件 → 拼 resources → i18next.init
  auth/login/{en-us,zh-cn}.ts              # 页面 → t('auth.login.*')
  home/{en-us,zh-cn}.ts                    # 页面 → t('home.*')
  component/require-auth/{en-us,zh-cn}.ts  # 组件 → t('component.require-auth.*')
  common/{en-us,zh-cn}.ts                  # 跨页面共用 → t('common.*')
```

- **页面 / 模块 / 组件目录**（`auth/login`、`home`、`component/require-auth`、`common`…）里**只能放语言文件**
- 装配逻辑永远待在根目录的 `config.ts`，语言清单一律在根目录的 `languages.ts`

### 硬性约束（违反即返工）

1. **一个文件只能有一种语言**。禁止在同一个文件里放两种语言，必须拆成 `<locale>.ts`（`en-us.ts` / `zh-cn.ts`）
2. **语言目录里不许出现非语言文件**：`index.ts`、`config.ts`、`README.md`、`.gitkeep` 一律不准放
3. 文件名必须是 `LANGUAGES` 里声明过的语言码（全小写带连字符，如 `en-us`），必须是 `.ts`，必须 `export default {}`
4. **key 前缀由目录决定**，文件内的 key 不许再重复目录名：`auth/login/zh-cn.ts` 里写 `title`（→ `auth.login.title`），写 `loginTitle` 是错的
5. key 里**禁止出现 `.`**（点号是 i18next 的路径分隔符，会把 key 拆成两级）
6. 同一个 key 在各语言文件里必须一一对应：**不许只加一种语言**，加 key 就成套加
7. 组件里**不许 import 语言文件**、不许写死英文/中文，一律 `t('...')`
8. 语言码全小写；`config.ts` 里的 `lowerCaseLng: true` **不要删**（见"排查"）

### 命名与分层

- **页面文案** → `<域>/<页面>/`：`auth/login`（登录页）、`home`（首页）
- **组件文案** → `component/<组件名>/`，**目录名与组件文件名一致**：`web/src/auth/require-auth.tsx` → `web/src/i18n/component/require-auth/` → `t('component.require-auth.loading')`
- **跨页面共用** → `common/`（如语言切换按钮文案）；不要图省事把页面/组件自己的文案全塞 `common`
- 不要在 `auth/` 这类域目录下放组件文案（旧的 `auth/guard/` 就是这么错的），组件一律进 `component/`
- 目录名 kebab-case，文件内的 key 用 camelCase（`signedInAs`、`authMode`），不要带语言、不要 `xxxText` / `xxxLabel` 这类后缀堆叠
- 插值统一 `{{name}}` 风格，且**每个语言文件里同一个 key 的插值变量必须一致**

### 三种常见改动

#### A. 加一条文案

1. 判断属于哪个目录：页面 → 对应页面目录；组件 → `component/<组件名>/`；跨页面 → `common/`
2. **每个** `<locale>.ts` 里都加同一个 key
3. 组件里 `const { t } = useLanguage()` → `t('auth.login.title')`

#### B. 加一个页面 / 组件

```bash
mkdir web/src/i18n/<domain>/<page>        # 页面
mkdir web/src/i18n/component/<component>  # 组件：<component> 用组件文件名（kebab-case）
# 每个语言建一个文件：en-us.ts / zh-cn.ts
```

`config.ts` **不用改**，它按文件名自动扫；目录路径自动成为 key 前缀。

#### C. 加一门语言

1. `languages.ts` 的 `LANGUAGES` 加一项（如 `'zh-tw'`），必要时改 `DEFAULT_LANGUAGE`
2. 在**每个**文案目录下加 `<locale>.ts`，内容与该目录的 key 完全对应
3. `config.ts` **不用改**

### 组件侧用法

```tsx
const { t, language, setLanguage, toggleLanguage } = useLanguage()

t('home.signedInAs', { name: user.name })
```

- 统一走 `web/src/hooks/use-language.ts` 的 `useLanguage()`，**不要**在页面里直接 `useTranslation()` 或 import i18next 实例
- 需要 index / 日期格式化时才用返回的 `i18n`
- `useLanguage().normalize()` 负责把 `en-US`、`zh-Hans` 这类语言码归一化成 `LANGUAGES` 里的值；改语言码规则时同步这里

### 装配机制（为什么不用手写 registry）

`web/src/i18n/config.ts`：

1. `import.meta.glob('./**/*.ts', { eager: true })` 扫出所有文件
2. 用 `/^\.\/(.+)\/([a-z]{2}-[a-z]{2})\.ts$/` 提取「目录」和「语言码」
3. 语言码必须属于 `LANGUAGES`，否则跳过 → `config.ts` / `languages.ts` 等非语言文件天然被忽略
4. 目录按 `/` 逐层 nest 进 `resources[locale].translation`

所以：**新增目录、新增语言都不需要动装配代码**，只要遵守文件名和目录约定。

### 排查：`t()` 返回 key 本身

按顺序查：

1. **key 前缀**是不是目录路径？`auth/login` → `t('auth.login.title')`
2. 文件名有没有拼错 / 大小写不对（必须在 `LANGUAGES` 里）
3. 是不是只加了当前语言的文件，另一种语言缺 key
4. `config.ts` 的 `lowerCaseLng: true` 还在吗？i18next 默认会把语言码规范成 `en-US`（region 大写）再去查 resources，我们全用小写 `en-us`，删了就全部查不到
5. 是不是在**非 Vite 环境**（Bun / Node 直接跑）里执行的？`import.meta.glob`、`import.meta.env` 是 Vite 专属
6. 插值变量名拼错时，i18next 会保留 `{{xxx}}` 原样输出，不会报错

### 验证

```bash
cd web && bun run typecheck && bun run lint
```

改了 `config.ts`、新增语言这类**必须证明翻译真能解析**的改动，用 SSR 构建实跑，别靠肉眼：

```ts
// web/src/__i18n-check.ts（临时文件，跑完删掉）
import i18n from './i18n/config'

// 资源全内联时 i18next 是同步初始化的，直接断言即可；
// 不确定就加个兜底等待：
if (!i18n.isInitialized) {
  await new Promise((resolve) => { i18n.on('initialized', resolve) })
}

console.log(i18n.getFixedT('en-us')('auth.login.title'))
console.log(i18n.getFixedT('zh-cn')('auth.login.title'))
console.log(JSON.stringify(i18n.getResourceBundle('en-us', 'translation')))
```

```bash
cd web
bunx vite build --ssr src/__i18n-check.ts --outDir .i18n-check --emptyOutDir
node .i18n-check/__i18n-check.js
rm -rf .i18n-check src/__i18n-check.ts   # 临时产物必须清掉，不要提交
```

顺手核对「一文件一语言」：`en-us.ts` 里不应出现中文，`zh-cn.ts` 里不应出现英文（唯一例外是 `common.switchTo` 这种"语言自称"文案）。

## 样式

- `web/src/index.css` 只做 `@import`，不写具体规则
- token 分层（各自一个文件）：
  - `web/src/styles/base.css` — 浅色 token（`:root`）、`@theme inline`、`@custom-variant`、`@layer base`、滚动条
  - `web/src/styles/dark.css` — 暗色三档 token
  - `web/src/styles/themes/<name>.css` — **一个主题色一个文件**（如 `sakura-pink.css`）

### 颜色模式 × 主题色 = 矩阵

**颜色模式 4 种**（由 `next-themes` 的 `light`/`dark` + `<html>` 上的 `data-dark-shade` 共同决定）：

| 模式 | 选择值 | 生效选择器 |
| --- | --- | --- |
| 亮色 | `light` | `:root` |
| 深黑 | `deep-black` | `.dark` |
| 深灰 | `dark-gray` | `.dark[data-dark-shade='dark-gray']` |
| 浅灰 | `light-gray` | `.dark[data-dark-shade='light-gray']` |

- `data-theme`（主题色）和 `data-dark-shade`（灰度）都挂在 `<html>` 上，保证 Portal 内容（Dialog/Select 等）也能继承

### 统一入口：`useThemeSettings()`

`web/src/hooks/use-theme-settings.ts` 是唯一改主题的地方，返回：
`mode` / `setMode`（亮色·深黑·深灰·浅灰）、`themeColor` / `setThemeColor`、
`background` / `setBackground`、`frosted` / `setFrosted`。

- 日夜交给 next-themes（`.dark` 类），其余四个维度统一写到 `<html>` 的 data 属性
- 组件样式侧对应 Tailwind 自定义变体：`frosted:`（`data-frosted`）、`bgimage:`（`data-background`）
- **两个变体职责不重叠：`bgimage:` 管半透明（有背景图就透），`frosted:` 只加 `backdrop-blur-*`、绝不改颜色**。
  实心组件要透出去就写 `bgimage:bg-card/60`，不要写 `frosted:bg-card/60`
- **不要再在页面里手写 `dataset.xxx`**，一律走这个 hook

**主题色只有一个颜色**：如 `sakura-pink` = `#ff8da1` = `oklch(0.772 0.139 9.7)`。暗色模式**不换色、不改 chroma/hue**，只是把同一个颜色调暗（降低 lightness），例如 浅灰 `-0.03`、深灰 `-0.06`、深黑 `-0.10`。不要另造颜色。

**前景色**：模式越黑，白色系 token（`--foreground` / `--*-foreground`）**越暗**；模式越亮则越亮。目的就是别让纯白在纯黑背景上刺眼。**不是越黑越亮。**

**每个主题色文件必须覆盖 4 种模式**，即 4 个 block：

```css
[data-theme='<name>'] { /* 亮色 */ }
.dark[data-dark-shade='deep-black'][data-theme='<name>'] { /* 深黑 */ }
.dark[data-dark-shade='dark-gray'][data-theme='<name>'] { /* 深灰 */ }
.dark[data-dark-shade='light-gray'][data-theme='<name>'] { /* 浅灰 */ }
```

新增主题色：在 `web/src/styles/themes/` 建文件（覆盖 `--primary` / `--ring` / `--sidebar-*` 等 token），再在 `index.css` 加一行 `@import`。

### 全局基础样式（`base.css` 的 `@layer base`）

- `*, ::before, ::after, ::backdrop { border-color: var(--border) }` — 修 Tailwind v4 默认 `currentColor` 边框
- `html { color: var(--foreground) }` — 让 Radix Portal 到 `body` 的内容（Dialog/Menu/Tooltip/Toast）也能继承前景色
- 滚动条：`*` 上 `scrollbar-width: thin` + `scrollbar-color: var(--scrollbar-thumb) transparent`，配合 `::-webkit-scrollbar` 的 8px 扁平 thumb、透明 track；hover 用 `--muted-foreground`
- `@utility scrollbar-none` — 需要隐藏滚动条时用
- 每个颜色模式都必须定义 `--scrollbar-thumb`（`base.css` 的 `:root` 与 `dark.css` 各档）

### 毛玻璃 / 背景图

这两个开关**正交**：背景图负责让组件半透明（`bgimage:`），毛玻璃只负责在它上面叠一层模糊（`frosted:`）。
细节各有专门的 skill，改之前先读：

- **背景图**（`bgimage:` 变体、开启后组件的透出/半透明处理、light/dark 的 token 选择）→ `.claude/skills/background-image/SKILL.md`
- **毛玻璃**（`frosted:` 变体只写 `backdrop-blur-*`、六条铁律、被祖先 `mask` 杀掉、第三方 CSS 无层要上 `!`）→ `.claude/skills/frosted-glass/SKILL.md`

## 配置

- 前端只读自己的 `web/.env`（示例见 `web/.env.example`），与后端的 `server/.env` **不共享**
- 目前唯一的 `VITE_` 变量是 `VITE_AUTH_MODE`（`cookie` | `localstorage`，默认 `cookie`），类型声明在 `web/src/vite-env.d.ts`
- 新增 `VITE_` 变量时同步更新 `web/.env.example` 与 `vite-env.d.ts` 的 `ImportMetaEnv`

## 应用标识（前端侧）

- 应用名称与版本的唯一来源是仓库根目录的 **`app.config.ts`**，前端直接 import（如 `web/src/pages/home.tsx` 里的 `import { APP_NAME, APP_VERSION } from '../../../app.config'`）
- 值是 **vite 构建时内联**进 `dist/assets/index-*.js` 的，改完必须重新 `vite build`（dev 下 `app.config.ts` 在依赖图里，会正常重载）
- 注意 import 层级：`web/src/pages/x.tsx` → `../../../app.config`；相对 import 排在 `@/` 别名 import **之后**，空一行
- 展示时**不要写死**：文案走 i18n（每个语言文件成套加 key），值传 `{ name: APP_NAME, version: APP_VERSION }`
- 完整规则、验证与排查见 `.claude/skills/app-version/SKILL.md`；打包与产物命名见 `.claude/rules/backend.md`

## `index.ts` 规范

与后端一致：**只做 re-export，不得出现类、函数、常量、配置、初始化等任何实现**。完整规则与反例见 `.claude/rules/backend.md` 的「`index.ts` 规范」。

```ts
// web/src/components/foo/index.ts —— 允许，纯转发
export { Foo } from './foo'
export type { FooProps } from './foo.types'
```

外部一行导入：`import { Foo } from '@/components/foo'`

## 代码风格

- 单引号、**不写分号**、2 空格缩进
- `tsconfig.app.json` 开了 `noUnusedLocals` / `noUnusedParameters` / `erasableSyntaxOnly`：不要留未使用的变量、不要用 enum / namespace / parameter properties
- `verbatimModuleSyntax`：只当类型用的 import 必须写 `import type`
- 组件文件与组件名 PascalCase（`require-auth.tsx` / `RequireAuth`），其余文件 kebab-case
- 提交前跑 `cd web && bun run typecheck && bun run lint`（oxlint）
