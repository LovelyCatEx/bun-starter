---
description: 前端（web/）开发规范。写前端代码、加页面/组件/hook、动样式与主题、加或改文案（i18n）、接认证时使用。涉及 web/src 的目录与 @ 别名、页面 / 组件 / hook 该放哪（页面专用建文件夹，全局两层只放通用件，业务进 hook 不进 tsx）、请求分层、react-i18next「目录即 key 前缀」的约定、Tailwind token 与四种颜色模式、应用标识、index.ts 与代码风格。
paths:
  - "web/**"
---

# 前端规范（`web/`）

Vite + React + React Router + Tailwind CSS + beUI + react-i18next。默认端口 `5108`，开发时 `/api/*` 代理到后端 `5107`。

命令、端口、目录概览见 `CLAUDE.md`；后端侧的规范见 `.claude/rules/` 下的 `backend` / `shared` / `auth` / `database` / `packaging`（各自按 `paths` 加载，关系见 CLAUDE.md 那张表）。

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

### 页面、组件、hook 的归属（硬性）

新东西放哪，**照这两步问，不要凭感觉**：

1. **会被第二个页面用吗？** 不会 → 什么都不用想，放进 `pages/<page>/components|hooks/`，别提前抽象。
2. **会。那它是"通用能力"还是"业务功能域"？**
   - 通用能力：浏览器 API、主题、i18n、长连接、通知这类"哪个页面都能用、跟业务无关"的东西 → `web/src/hooks/`（`use-xxx.ts` 平铺；需要配套文件时在该 hook 名下开文件夹，如 `hooks/notification/`）
   - 业务功能域：`auth` 这种"这个系统里谁在登录 / 什么业务概念"的东西 → 自己一个文件夹（`web/src/<feature>/`），它的 hook 跟着它走

判据只有这两步，别拿"它长得像一个 hook"当理由往 `hooks/` 塞业务（`auth/use-auth.ts` 就是反例），也别把通用能力塞进业务文件夹。

| 放哪 | 只放什么 | 现有例子 |
| --- | --- | --- |
| `web/src/components/` | **全局通用组件**：跨页面复用、与具体业务无关 | `components/{motion,agents,charts}/`（beUI 生成物） |
| `web/src/hooks/` | **全局通用 hook**：跨页面复用、与业务无关（浏览器能力、主题、i18n、长连接这类）。配套文件多时在该 hook 名下开文件夹 | `use-device` / `use-language` / `use-websocket`；`hooks/notification/`（`notification.ts` + `use-notification.ts`） |
| `web/src/<feature>/` | **业务功能域**自己的东西；业务的 hook 跟着业务走，**不要**塞进 `components/` 或 `hooks/` | `auth/`（含 `use-auth.ts`） |
| `web/src/pages/<page>/` | **只服务这个页面**的一切：页面本体 + `components/` + `hooks/` | `pages/debug/` |

- `components/` 下是设计系统那一层：**`motion/`（交互与动效，单个组件的多文件版放同名子目录）、`agents/`（对话与 agent 相关）、`charts/`（图表）三个目录是 beUI 生成物，业务组件一个都不许进去**；`components/` 根下只放跨页面的通用件
- beUI 的组件**不要 fork 内部实现**：要改样式就传 `className`，要改行为优先看有没有现成 prop —— 生成物被上游覆盖时手改会丢。要加自己的变体，包一层再导出
- 页面只有一个文件时**不用**建文件夹（`pages/home.tsx`、`pages/login.tsx`）；出现第一个页面专用组件 / hook 时再建，别提前抽象
- 反过来也一样：**只被一个页面用的东西不许放全局那两层**。真被第二个页面复用了，才把它提升上去
- 页面文件夹的形状（`pages/debug/` 就是现成例子）：

```
web/src/pages/debug/
  theme.tsx          # 页面本体：路由指向它，只负责拼装与渲染
  components/        # 只服务这个页面的组件（Section / Demo / 各种 section）
  hooks/             # 只服务这个页面的 hook：这个页面的业务逻辑写在这里
```

**`.tsx` 里不许堆业务逻辑。** 组件只做"从 hook 拿状态和数据 → 渲染"；请求编排、多步状态流转、数据变换、错误分支、防抖节流全部写进 hook（页面专用的就写 `pages/<page>/hooks/`，跨页面的写 `hooks/` 或功能文件夹），hook 里调 `@/api/<feature>/<feature>.ts` 的方法，不自己发请求。

### beUI 组件（生成物）：引入与维护

组件层是 **beUI**（`@beui` shadcn registry，`https://beui.dev/r/{name}.json`），
已全量引入到 `web/src/components/{motion,agents,charts}/` + `web/src/lib/`。
**beUI 组件不建立在任何 shadcn 原语之上**（registry 里每条 `registryDependencies` 都是空的），
所以要加组件就是"再装一个"，不存在"在哪个原语上改"。

**装一个组件**：

```bash
cd web && ./node_modules/.bin/shadcn add <slug> [<slug> ...] --yes --overwrite
```

- 用**本地 CLI**（`shadcn` 在 `web/package.json` 里），别用 `bunx shadcn@latest`：版本飘了行为就飘
- 多个 slug 写一条命令，公共依赖它自己去重，不会反复问
- ⚠️ **`--yes` 不抑制"这个文件已存在，覆盖吗"**（多个 slug 依赖同一个公共文件时必问），
  非交互场景会直接卡死 —— 要加 `--overwrite`
- `web/components.json` 的别名要盯住两个：
  - **`aliases.lib` 必须是 `@/lib`**：beUI 的 `files[].target` 写的是 `@lib/ease.ts` 这类，
    CLI 按 `aliases.lib` 解析落点，而组件内部 import 的是 `@/lib/ease`。配错的话文件落到别处、
    组件按 `@/lib/...` 找不到 —— **一装就全红**，且报错看起来像"文件没生成"
  - **`aliases.utils` 必须是 `@/lib/utils`**（`cn` 所在的模块）。它以前指着 `@/utils`，
    而那个目录已经不存在了 —— 留着的话下次 `shadcn add` 会凭空重建一个 `web/src/utils/`，
    于是仓库里多出第二个 `cn`
  - `aliases.ui`（`@/components/ui`）现在**是个空指向**：beUI 每个文件都带显式 `target`，
    用不到这个别名。**但如果你用 CLI 装一个「普通 shadcn 组件」（不带 target 的那种），
    它会照着这里重建 `components/ui/`** —— 那等于又开了一层组件体系。真要用这种组件，
    装完立刻把它挪进 `components/` 下合适的目录并改掉 import

**⚠️ 已实测的两个"装完必坏"，每次重装都会回来。**

1. **CLI 会把同名文件的 import 改错。** 不同 slug 依赖的文件 **basename 相同**时，CLI 把生成的
   `import` 指向组件目录里那份，而真正的源在 `lib/` 下。实测命中 **2 处**：
   `motion/text-shimmer.tsx` 和 `agents/loading-states/reasoning-text.tsx` 里的
   `} from "@/components/motion/text-shimmer"` —— **自己导入自己**，而那三个常量其实在
   `lib/text-shimmer.ts`。改回 `@/lib/text-shimmer` 即可。
   （核对过 registry 源码，上游写的是对的，是 CLI 改写引入的。）见到
   `Cannot find module` / `has no exported member` / `Circular definition of import alias`
   先怀疑这一类，别怀疑组件本身。
2. **`motion/parallax.tsx` 有一个 motion 13 不认的选项。** 上游源码里有 `layoutEffect: false`
   （按 framer-motion 11 的语义写的），而本仓库的 motion 13 的 `UseScrollOptions` 里
   **没有**这个键、整个包里也搜不到这个字符串 —— 它现在是**惰性的**。那一行带着
   `// @ts-expect-error` 和说明留在原地：既是唯一的意图记录，也是个探针，
   哪天上游或 motion 对上了，它会反过来报"未使用的 expect-error"，提醒可以删。

所以**重装之后必须 `bun run typecheck`**，上面两条都会在这里现形。

**不要手改生成物内部实现。** 要调样式传 `className`，要调行为先找现成 prop；非改不可就包一层。
上游一更新，直接落在生成物里的改动会被覆盖 —— 上面那两条修正是**例外**，它们是把上游源码
改回上游本意（`text-shimmer`）或在类型层面对齐（`parallax`），重装后要重做。

**还有第三条例外，是唯一一条"改样式"的：`motion/switch.tsx` 的旋钮。** 上游写的是
`bg-background` —— 那是**页面底色**的 token，而旋钮坐在 `bg-primary` 的轨道上，两个不同的
表面。后果是深色档里主题色一上（sakura-pink 深黑 `--primary` = `oklch(0.64 0.139 9.7)`），
旋钮永远是 `oklch(0.145)` 的**近黑**，看着像粉底上一个黑洞。**这跟主题色无关、也修不好：
`--background` 只在 `base.css` 的 `:root` 与 `dark.css` 的三档里定义，主题文件一个都不碰它**
（主题只写 `--primary` / `--primary-foreground` / `--ring` / `--sidebar-*` 六个）。

改法是让旋钮跟它坐的表面配对，勾选态用 `--primary-foreground`；未勾选态（轨道是
`--muted-foreground/60`，中性色）保持 `bg-background` 不动：

```tsx
checked ? "bg-primary-foreground" : "bg-background",
```

这不是"我们的偏好"，是 beUI 自己的规矩：`overflow-actions.tsx` 用 `bg-primary
text-primary-foreground`，range-slider 的旋钮（`range-slider-bubble.tsx:93`）坐在
`bg-foreground` 的填充上所以用 `bg-background` —— **旋钮 = 它所坐的那个东西的对比色**。
switch 是唯一破了这条的组件，所以改它不算另立一套。

⚠️ **这条 `typecheck` 抓不到**（另外两条会报错，它只是"悄悄变回上游"）。重装后自己确认一下：

```bash
grep -n 'bg-primary-foreground' web/src/components/motion/switch.tsx   # 空 = 被冲掉了
```

代价说清楚：深黑 + sakura 档 ΔL 从 0.495 掉到 0.315（旋钮近黑→近白）。仍高于上游本来就在跑的
亮色 + sakura 档（0.218），所以在这个设计系统自己容忍的范围内。

**在 beUI 之上写自己的动效时，跟着它自己的三条走**（上游 `AGENTS.md` 的约定，别另立一套）：

- 新的 animation 用 `motion/react` 的 **`useReducedMotion()`** 门一下 —— 组件库自己全都这么写，
  外面套的动画不门就会变成"库尊重了减弱动效、你加的没尊重"
- 磁吸 / 倾斜这类**装饰性** hover 效果，用 **`useHoverCapable()`** 挡掉触屏（它同时看指针类型和
  `prefers-reduced-motion`）—— 在 **`@/lib/hooks/use-hover-capable`**，是注册表装的 helper，
  别自己写 `matchMedia('(hover: hover)')`
- 只动 **`transform` / `opacity`**，不动 layout 属性（`width` / `height` / `top` / `margin`）。
  这条和本仓库的性能取向一致：动画跑在合成层，不触发布局重排

- 判据：一个组件里 `useState` / `useEffect` 攒到两三个、或者出现 `await` 业务请求 → 抽 hook
- 纯展示组件（props 进、JSX 出）不受这条约束，但它们**不许偷偷读全局状态**：props 就是全部输入

```tsx
// ❌ 页面里堆业务：请求、状态、加工、错误分支全在组件里
export function OrdersPage() {
  const [orders, setOrders] = useState<OrderVo[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listOrders().then(setOrders).catch((e) => setError(e.message))
  }, [])

  const pending = orders.filter((o) => o.status === 'pending')

  return <>{error ? <p>{error}</p> : pending.map((o) => <OrderRow key={o.id} order={o} />)}</>
}

// ✅ 业务在 pages/orders/hooks/use-orders.ts，组件只渲染
const { pending, error } = useOrders()

return <>{error ? <p>{error}</p> : pending.map((o) => <OrderRow key={o.id} order={o} />)}</>
```

## 共享层（仓库根目录 `shared/`）

定义、边界与禁止清单在 **`.claude/rules/shared.md`**（改 `shared/**` 时自动加载）。前端侧只要记住三条：

- 前端**只当类型用就 `import type`**（如 `AuthUserVo`、`WsResponse`），零运行时开销；确实要用到常量 / 类（`CODE_OK`、`WS_PING`）才值导入
- **不要在 `web/src/api/<feature>/` 里再写一份 dto / vo**：抄错一边的症状是"类型都对、跑起来解不开包"。要改形状就改 `shared/`，两端一起变
- 前端**不许**改 `shared/` 去迁就前端（`localStorage` / `window` / `fetch` 都不许进去），也**不要去"顺手格式化"它** —— 共享层是后端风格（单引号 + 分号），被两端格式化工具来回改是没完的

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

后端侧（帧结构、`WsRequest` / `WsResponse`、parse 与错误帧）见 `.claude/skills/websocket/SKILL.md`；硬性约束在 `.claude/rules/backend.md` 的「WebSocket」一节。

## 页面可见性（`web/src/hooks/use-page-visibility.ts`）

"人还在不在这个页面里"—— 两个层次，别混：`visible`（标签页在显示）和 `focused`（这扇窗正在被用），
`active` = 两者都满足。**要的几乎总是 `active`**。

```tsx
const { active } = usePageVisibility()
const isHere = useIsPageActive()   // 只问这一个问题时用简写
```

- **可见但没焦点**那一档最容易被漏掉：用户在看别的窗口、这个页面还在屏幕上。系统通知该弹（所以通知模块就是这么判的），但"标记已读""暂停轮询"这类要按 `active` 算
- 事件只是"该重读了"的信号，状态一律现读 DOM（`document.hasFocus()`）—— 少听一个事件也不会卡住，别用事件自己拼状态
- 全局一份 store（`useSyncExternalStore` + 缓存快照，快照引用不变才不会无限重渲染）：多个组件共用一组 DOM 监听，**非 React 代码**（`notification.ts`）也能用 `isPageVisible()` / `isPageActive()`
- **不要在组件里手写 `visibilitychange` / `focus`** —— 手写的那份迟早和这里判得不一样

## 浏览器通知（`web/src/hooks/notification/`）

**本地通知**：页面还活着时用系统通知提醒用户。页面关掉也要收是 Web Push（Service Worker + VAPID + 服务端存订阅），本项目不做。
`notification.ts` 管权限与"发一条"，`use-notification.ts` 是组件入口（`useNotification()`）。

- **权限只能在用户手势里申请**：接到按钮的 `onClick` 上，**不许**在 `useEffect` 里自动调 —— Safari 不弹，Chrome 会把它当"静默请求"，等于把这个 origin 唯一一次弹窗机会浪费掉。`denied` 是不可逆的：UI 必须区分"还没问过（可引导）"和"被拒了（只能去浏览器设置改）"
- **`supported` 里含 `isSecureContext`**：dev 的 `http://localhost` 算安全上下文，但**打包产物用局域网 http 打开时通知永远不可用**（`Notification` 直接不存在），UI 要能说出原因，别给一个点了没反应的按钮
- **页面可见且有焦点时默认不发**（`notify()` 返回 `false`），前台交给页面内的 toast；判定走 `use-page-visibility` 的 `isPageActive()`（"可见但没焦点"算不在，那正是最该弹的时候）。要前台也弹就显式 `whenFocused: true`
- **`notify()` 返回 boolean**（真弹了才 true，弹不出不抛），调用方据此决定要不要退回 toast；`tag` 用 `<feature>.<id>`（`chat.<roomId>`），同 tag 互相替换、连发自动合并；回到页面时会收掉本页创建的通知
- 文案是**发送那一刻的快照**：i18n 的 key 在调用方翻好再传进去（`notify({ title, body })`），之后切语言不会重发
- **事件 → 通知的映射属于业务**：写在 `pages/<page>/hooks/use-xxx-notifications.ts`（配合 `useWebSocket({ handlers })`），全局模块里不许认识业务事件

调试页的 `pages/debug/components/notification-section.tsx` 是现成用法示例（含权限、tag 合并、前台策略、点击回调四种）。

**验证没有浏览器怎么办**（本仓库没有测试框架）：`notification.ts` 的业务判断不依赖 React（只 import 了 `use-page-visibility` 的纯函数），所以能直接用一个**伪浏览器**跑它 —— 在 `bun` 里给 `globalThis` 装上假的 `window` / `document` / `Notification`（class 上带 `static permission`、`instances`、`close()` 计数），然后 `await import()` 这个模块，逐条断言：未授权不发、前台不发、`whenFocused` 才发、`close(tag)` 只关对上的、点击触发 `window.focus` + 回调、回到页面收掉全部、`isSecureContext=false` 时 `supported` 为假。⚠️ 桩必须把 `Notification` **挂到 `window` 上**（真实浏览器里 `window === globalThis`），只挂 `globalThis` 会让模块里那句 `'Notification' in window` 判成不支持，测出一堆假失败。

## 认证（`web/src/auth/`）

- 认证方式由 **`web/.env` 的 `VITE_AUTH_MODE`** 决定：`cookie`（默认）| `localstorage`，非法或缺省时回退 `cookie`（见 `web/src/auth/auth-mode.ts`）
- token 读写只走 `web/src/auth/token-store.ts`；**cookie 模式下三个方法都是 no-op**（JS 读不到 httpOnly cookie），登录态只能靠 `GET /api/auth/me` 判断
- 请求头与 401 只在 `web/src/api/requests.ts` 一处处理：自动挂 `Authorization`（localstorage 模式）、`credentials: 'include'`、401 触发 `setUnauthorizedHandler`（登录接口除外）
- 登录相关的形状来自共享层：`LoginDto` / `LoginVo` / `AuthUserVo` 在 `@shared/auth/{dto,vo}/`（`AuthUserVo` 是"能出现在响应里的那几个字段"，**不是**后端的 `AuthUser` 内部模型）
- 登录态与守卫：`auth-provider.tsx`（挂载时 `getMe` 判定）→ `useAuth()` → `require-auth.tsx`，受保护路由包在 `<Route element={<RequireAuth />}>` 里；`AuthProvider` 必须放在 `BrowserRouter` **内部**（要用 `useNavigate`）
- 业务代码不要自己读 token、也不要自己处理 401

后端侧（JWT、cookie、放行清单、WS 升级的口子）见 `.claude/rules/auth.md`。

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
7. 组件里**不许 import 语言文件**、不许写死英文/中文，一律 `t('...')`（唯一例外见下）
8. 语言码全小写；`config.ts` 里的 `lowerCaseLng: true` **不要删**（见"排查"）

**例外：`web/src/pages/debug/**` 不做 i18n。** 调试页是开发期自己看的、**上线前会整页删掉**，所以它的文案一律**英文硬编码** —— 这是全仓库唯一允许写死文案的地方。别给调试页加语言文件（白做），也别拿它当一个"i18n 没做全"的例子去改。

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

### 颜色只能用 token（禁止硬编码）

组件里**不许出现硬编码颜色**：`bg-white` / `bg-black` / `bg-[#fff]` / `bg-[rgba(...)]` / `text-white`。
一律用语义 token（`bg-background` / `bg-card` / `bg-popover` / `bg-muted` / `bg-secondary` / `bg-primary`、
`text-foreground` / `text-muted-foreground`、`border-border` / `border-input` / `ring-ring`…），
这样四档暗色、每个主题色两件事才自动正确。

**例外是"颜色本身就是语义"的那几层**：`drawer` / `animated-sidebar` 的抽屉 scrim、`attachment-upload`
的图片预览遮罩（`bg-black/40` 这类）—— 它们本来就该是黑，不跟主题走是有意的。
但这类层必须是**盖在内容之上的全屏层**，**不能变成某个面板里的一块硬白块**。
判据就一句：把这个颜色换成 `bg-card`，**它还是它吗？** 不是 → 语义层，保留；是 → 面子，换 token。

**第二条例外：状态色走 `--success` / `--warning`，不要写 `emerald-*` / `amber-*`。**
beUI 的图表与反馈组件按语义取色（涨=success、跌=warning、危险=destructive），这几个 token
与 `--destructive` 同性质 —— **颜色本身就是语义**：不跟主题色走，四档暗色里只按"背景越深、明度越高"
调一档（`--destructive` / `--success` / `--warning` 在 `dark.css` 都有一个提亮值）。
用 `text-success` / `bg-success/10` / `fill-warning` 这类写法，
**别**用 `text-emerald-600 dark:text-emerald-400` —— 后者不跟主题色、也不跟暗色档位走。
token 都在 `base.css` 的 `:root` 与 `dark.css` 的 `.dark`（深灰/浅灰继承 `.dark`，不单独定义）。

> ⚠️ 生成物里**故意留着**的硬编码色，是**改不得**的：`morphing-tabs`、`not-found/{terminal,glitch,spotlight}`
> 是固定设计（终端窗口、暗场聚光灯），`charts/*` 的调色板与 `chromatic-text-reveal` 的彩虹是组件身份，
> `expanding-arrow-button` 的深色导轨 + lime 强调同理。重新 `shadcn add` 会把这些连同上面的 token 化
> **一起冲掉**（见「beUI 组件（生成物）」一节的说明），别手贱去"顺手修"。

### 颜色模式 × 主题色 = 矩阵

**颜色模式 4 种**（由 `next-themes` 的 `light`/`dark` + `<html>` 上的 `data-dark-shade` 共同决定）：

| 模式 | 选择值 | 生效选择器 |
| --- | --- | --- |
| 亮色 | `light` | `:root` |
| 深黑 | `deep-black` | `.dark` |
| 深灰 | `dark-gray` | `.dark[data-dark-shade='dark-gray']` |
| 浅灰 | `light-gray` | `.dark[data-dark-shade='light-gray']` |

- `data-theme`（主题色）和 `data-dark-shade`（灰度）都挂在 `<html>` 上，保证 Portal 内容
  （beUI 的 popover / menu / tooltip / toast 都会 portal 到 `body`）也能继承

### 统一入口：`useThemeSettings()`

`web/src/hooks/use-theme-settings.ts` 是唯一改主题的地方，返回：

- `mode` / `setMode`（亮色·深黑·深灰·浅灰）、`themeColor` / `setThemeColor`
- `background` / `setBackground`（背景图开关）、`overlay` / `setOverlay`（遮罩开关）、
  `overlayOpacity` / `setOverlayOpacity`（0~1，**滑块上的值**；实际生效值见 provider）

- 状态在 `web/src/hooks/theme-settings-provider.tsx` 的 `<ThemeSettingsProvider>` 里（挂在 `main.tsx` 的 `<ThemeProvider>` 内、`BrowserRouter` 外），
  所以**任何组件调这个 hook 拿到的都是同一份**；页面和页面里的 section 可以各调各的。在 provider 外面调会直接抛错
- 日夜交给 next-themes（`.dark` 类），其余维度统一写到 `<html>` 的 data 属性：
  `data-theme`（主题色）/ `data-dark-shade`（灰度）/ `data-background`（背景图），
  外加 `--background-overlay-opacity`（遮罩**实际生效**透明度，开关关掉时就是 0）
- 都挂 `<html>` 而不是页面容器，是因为 beUI 的浮层（popover / menu / tooltip / toast）会 portal 到 `body`
- **不要再在页面里手写 `dataset.xxx`**，一律走这个 hook
- **组件侧只有一个可选的自定义变体：`bgimage:`**（见下面「背景图」一节）。它是个**工具**、
  **没有任何 beUI 组件默认使用它** —— 组件现在就是 beUI 原生样式，没有"跟着开关自动变外观"的机制；
  要改某个组件的外观就传 `className`，要让它透出背景图才挂 `bgimage:`

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
- `html { color: var(--foreground) }` — 让 Portal 到 `body` 的内容（beUI 的 popover / menu / tooltip / toast）也能继承前景色
- 滚动条：`*` 上 `scrollbar-width: thin` + `scrollbar-color: var(--scrollbar-thumb) transparent`，配合 `::-webkit-scrollbar` 的 8px 扁平 thumb、透明 track；hover 用 `--muted-foreground`
- `@utility scrollbar-none` — 需要隐藏滚动条时用
- 每个颜色模式都必须定义 `--scrollbar-thumb`（`base.css` 的 `:root` 与 `dark.css` 各档）

### 背景图（`bgimage:`）与遮罩

调试页可以开一层**背景图 + 遮罩**，两层都在 `web/src/pages/debug/components/background-layer.tsx` 里。
图案不是图片文件，是内联 SVG data URI + 几个径向渐变（色标全带 alpha、叠在 `bg-background` 上），
所以**一份就同时成立在亮色与四档暗色下**，没有第二个素材要维护。
做法是**机制层**，生成物一个字都不动：

- `<html data-background="true">` 由 `useThemeSettings()` 写；**画那两层的只有调试页**
  （首页 / 登录页保持干净底色）。层级固定两层：`-z-20` 图案 / `-z-10` 遮罩 / `0` 内容，
  前提是 `<main>` 上有 **`isolate`** —— 少了它负 `z-index` 会退到页面背景之后，看着像"没生效"
- 遮罩亮色压白、暗色压黑（`bg-white dark:bg-black`），厚度走 `<html>` 上的
  `--background-overlay-opacity`
- 组件**保持 beUI 原生**，不透出背景图。要让某个元素透出来，在它的 className 上写
  **`bgimage:bg-card/60`** —— `bgimage:` 是 `base.css` 里的 `@custom-variant`，只在
  `data-background='true'` 时生效

**`bgimage:` 是工具、不是自动机制，而且全仓库只有调试页一个调用点**（`theme-section.tsx` 的示例块）。
那个调用点**不能删**：Tailwind v4 对没有消费者的 utility 不生成 CSS，删了它，变体在源码里看着好好的、
产物里是空的（这个仓库被"静默不生成 CSS"坑过）。给 beUI 组件挂 `bgimage:` 是允许的，
**不用改生成物、重装冲不掉** —— 这正是这一版跟上一版（把 `bgimage:` / `frosted:` 写进 ~60 个生成物）的
区别，也是那套东西被删掉的原因。

挑 token 只用**两种模式都不透明**的（`--card` / `--muted`）：`/60` 是等比降透明度、颜色不变。
**不要**拿 `--background` 去替换一个"暗色下本来就是浅灰半透明"的控件 —— 它在暗色下是近黑，
会把那个控件变成"黑色半透明"。

#### 背景图模式下的边框：只压 `--border` 与 `--border-strong`

背景图带花纹，原来那圈浅灰细边框压上去会糊掉。`base.css` 里四条规则把这两个 token 压深一档，
**再往下一档由遮罩厚度决定**（区间故意只有 5 个点，也就是 `+ o * 0.05`）：

| 模式 | 选择器 | `--border` | `--border-strong` |
| --- | --- | --- | --- |
| 亮色 | `html[data-background='true']` | `0.922` → `0.78` | `0.87` → `0.73` |
| 深黑 | `html.dark[data-dark-shade='deep-black'][data-background='true']` | `10%` → `24%` | `20%` → `34%` |
| 深灰 | `html.dark[data-dark-shade='dark-gray'][data-background='true']` | `14%` → `28%` | `20%` → `34%` |
| 浅灰 | `html.dark[data-dark-shade='light-gray'][data-background='true']` | `20%` → `34%` | `26%` → `40%` |

- 暗色三块必须写成 `html.dark[data-dark-shade='x'][data-background='true']`（`(0,3,1)`），
  才压得过 `dark.css` 的 `.dark`（`(0,1,0)`）与 `.dark[data-dark-shade='x']`（`(0,2,0)`）
- `var(--background-overlay-opacity, 0)` 里的 **`, 0` 不能省**：裸 `var()` 在首帧会让整条
  `calc()` 在计算值阶段整个失效（该变量与 `data-background` 由同一个 effect 写入，不会有中间态）
- 只覆盖这两个 token，是**实测**的决定：`--border` 有 167 处读者；`--border-strong` 有
  **10 个生成物文件、12 处，其中 5 处是 hover 边框**（`select` / `select-morph` / `multi-select` /
  `combobox` 的 trigger + `morphing-search`）—— 不跟着压深的话，图案上悬停看不到反馈。
  `--input` 与 `--sidebar-border` 在 beUI 里**消费者是 0**（`border-input` / `bg-input` / `ring-input`
  一处都没有），所以不进这套规则
- 四档写在一起、不回 `dark.css`：改区间时一眼看全
- **有意不跟这套规则**的：14 个文件用 `ring-foreground` 画环（`ring-border` 只有 2 处）；
  33 处 `disabled:opacity-*`、6 个 `mask-image` 包裹会压平后代的 `backdrop-filter`

#### 这一节刻意不做的事

- **没有独立的毛玻璃 / 模糊开关**（上一版有 `frosted:`）：特性缩到一个变体，这一节就装得下。
  真要回到"全组件归一化"那套，旧的两份 skill 在 `git show c8d485b:.claude/skills/` 里
- **不归一化生成物自带的玻璃**：`dock` / `animated-toast-stack` / `project-folder` 这些自带
  `bg-card/80 backdrop-blur-xl` 的地方**保持上游写法**，那就是它的设计。要调就**传 `className`**，
  别改生成物内部（上游一更新就被冲掉）

以后真要加模糊，记住两条仍然成立的老坑：

- **祖先带 `mask` / `filter` / `opacity`，后代的 `backdrop-filter` 会整个失效** ——
  最典型的是 `scroll-fade-*` 这类滚动边缘淡出（它就是个 `mask`）。
  症状是"单独看组件有效果、放进列表里就没了"，只看组件本身永远查不出来
- **弹层的 content 可能是 `position: fixed`（beUI 有 12 个组件用 `@floating-ui/dom` 定位）**，
  把 `backdrop-filter` 加在这种容器本体上会**改变 fixed 后代的包含块**，位置就飘了。
  要模糊就挂在 `before:` 伪元素上（`before:absolute before:inset-0 before:rounded-[inherit] before:-z-10 before:backdrop-blur-md`），
  `rounded-[inherit]` 不能省 —— 伪元素默认是个矩形，圆角面板上会露出四个直角

## 配置

- 前端只读自己的 `web/.env`（示例见 `web/.env.example`），与后端的 `server/.env` **不共享**
- 目前唯一的 `VITE_` 变量是 `VITE_AUTH_MODE`（`cookie` | `localstorage`，默认 `cookie`），类型声明在 `web/src/vite-env.d.ts`
- 新增 `VITE_` 变量时同步更新 `web/.env.example` 与 `vite-env.d.ts` 的 `ImportMetaEnv`

## 应用标识（前端侧）

- 应用名称与版本的唯一来源是仓库根目录的 **`app.config.ts`**，前端直接 import（如 `web/src/pages/home.tsx` 里的 `import { APP_NAME, APP_VERSION } from '../../../app.config'`）
- 值是 **vite 构建时内联**进 `dist/assets/index-*.js` 的，改完必须重新 `vite build`（dev 下 `app.config.ts` 在依赖图里，会正常重载）
- 注意 import 层级：`web/src/pages/x.tsx` → `../../../app.config`；相对 import 排在 `@/` 别名 import **之后**，空一行
- 展示时**不要写死**：文案走 i18n（每个语言文件成套加 key），值传 `{ name: APP_NAME, version: APP_VERSION }`
- 完整规则、验证与排查见 `.claude/skills/app-version/SKILL.md`；打包与产物命名见 `.claude/rules/packaging.md`

## `index.ts` 规范

与后端一致：**只做 re-export，不得出现类、函数、常量、配置、初始化等任何实现**。完整规则与反例见 `.claude/rules/backend.md` 的「`index.ts` 规范」。

```ts
// web/src/components/foo/index.ts —— 允许，纯转发
export { Foo } from './foo'
export type { FooProps } from './foo.types'
```

外部一行导入：`import { Foo } from '@/components/foo'`

## 代码风格

- 单引号、**不写分号**、2 空格缩进。⚠️ 这条只管**手写**文件：`web/src/components/{motion,agents,charts}/**` 和 `web/src/lib/**` 是 beUI 生成物，用**双引号 + 分号**（与 shadcn 那种"双引号但不写分号"不同，实测 218 个生成文件全部双引号、12403 行以分号结尾），别照抄它的引号，也别照抄它的分号；反过来也别把 `server/` 的分号风格带过来 —— 两边是反的，来回切文件时最容易串味
- 自查行尾分号（输出应当为空 —— 有输出就是被 `server/` 带串味的手写文件）：

  ```bash
  grep -rn ';$' web/src --include="*.ts" --include="*.tsx" \
    | grep -vE '/components/(motion|agents|charts)/|/lib/'
  ```

  ⚠️ `--include` 的值**一定要加引号**：不加的话 zsh 会先把 `*.ts` 当 glob 展开，报 `no matches found` 直接不执行（这个坑踩过三次）
  那条 `grep -v` 排掉生成物，是因为上游哪天改了风格不该算在我们头上；`;$` 匹配的是"以分号结尾的行"，也正是后端每个 `import` / 语句的写法
- `tsconfig.app.json` 开了 `noUnusedLocals` / `noUnusedParameters` / `erasableSyntaxOnly`：不要留未使用的变量、不要用 enum / namespace / parameter properties
- `verbatimModuleSyntax`：只当类型用的 import 必须写 `import type`
- 组件文件与组件名 PascalCase（`require-auth.tsx` / `RequireAuth`），其余文件 kebab-case
- 提交前跑 `cd web && bun run typecheck && bun run lint`（oxlint）
