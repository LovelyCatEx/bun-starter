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
- beUI 的组件**可以直接改**（重装时会被覆盖，改动清单见下面「引入与维护」一节）；加自己的变体还是优先包一层再导出，别把业务逻辑写进生成物
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

**⚠️ 两个上游自带的"装完必坏"，每次重装都会回来。**

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

**改生成物是允许的**，直接改就行，不用再包一层。唯一的实际约束是**重装会丢**：
`shadcn add --overwrite` 会把文件覆盖回上游版本。所以每处改动都留一条探针，
重装后扫一遍下面这几条。

上面两条是"上游的坑"，下面两条是"我们的改动"：

**3. `motion/switch.tsx` 的旋钮配色。** 上游写的是 `bg-background` —— 那是**页面底色**的
token，而旋钮坐在 `bg-primary` 的轨道上，两个不同的表面。后果是深色档里主题色一上
（sakura-pink 深黑 `--primary` = `oklch(0.64 0.139 9.7)`），旋钮永远是 `oklch(0.145)` 的
**近黑**，看着像粉底上一个黑洞。**这跟主题色无关、也修不好：
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
代价说清楚：深黑 + sakura 档 ΔL 从 0.495 掉到 0.315（旋钮近黑→近白）。仍高于上游本来就在跑的
亮色 + sakura 档（0.218），所以在这个设计系统自己容忍的范围内。

⚠️ **这条 `typecheck` 抓不到**（上面两条会报错，它只是"悄悄变回上游"）。

```bash
grep -n 'bg-primary-foreground' web/src/components/motion/switch.tsx   # 空 = 被冲掉了
```

**4. 高斯模糊的 `data-slot`（四组：`motion/` 下按钮 10 个文件 16 处、表单 21 个文件 27 处、
`agents/` 下 agent-tools 9 个文件 12 处、导航 / 布局 7 个文件 10 处；另加
`motion/context-menu.tsx` 1 处、`motion/popover-morph.tsx` 1 处、
`motion/animated-toast-stack.tsx` 2 处、`motion/notification-stack.tsx` 2 处与调试页演示框
1 处 × 5 个，见下）。**
高斯模糊靠这个属性命中组件（beUI 的 Button 没有任何可选的属性，光靠类名认不出来 —— 理由见下面
「高斯模糊」一节）。**只加属性、不加任何样式**，样式全在 `styles/frosted.css`。

```bash
grep -rho 'data-slot="[a-z-]*"' web/src/components/motion web/src/components/agents --include='*.tsx' \
  | sort | uniq -c | sort -rn
# 除了 data-slot="button"（16）、表单那一组（27），还会看到 sidebar-* / preview-rail-* /
# digit-swap 之类**跟模糊无关**的旧标记 —— 那些是组件自己的 DOM 语义，别去动
# （`context-menu-content` 只有 1 处；`breadcrumb-link` 是这个 grep **漏得掉**的一个：
#  它写在 linkProps 对象里（`"data-slot": "breadcrumb-link"`），不是 JSX 属性；
#  `demo-panel` 也不在这个 grep 里：它打在调试页的 section 文件上，不在 `components/` 下）
```

**最可靠的探针是产物，不是源码 grep** —— 它同时给出两张表，一眼能看出"哪一处丢了"，
（本轮就是它抓到 `morphing-tabs.tsx` 那两处标记被冲掉、而 `grep` 因为文件回到了 HEAD 版本
所以什么都没报）：

```bash
cd web && bun run build
python3 - <<'EOF'
import re, glob
txt = ''.join(open(f, encoding='utf-8', errors='replace').read() for f in glob.glob('dist/assets/*.js'))
present = set(re.findall(r'"data-slot"[:=]\s*[`"\']([a-z0-9-]+)', txt))   # 产物里是反引号，别只 grep 双引号
css = set(re.findall(r"data-slot='([a-z0-9-]+)'", open('src/styles/frosted.css').read()))
print('样式里提到、产物里没有的 slot：', sorted(css - present) or '无')
EOF
```

这个属性是"我是按钮"的**身份标记**，不是样式补丁；哪怕某个组件现在还是 `bg-transparent`
（`icon-button` / `copy-button` / `expandable-control` 就是），也照样打上，省得它哪天有了底色
再回来补。所以**每加一个按钮组件就要多打一处**。

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
  - `web/src/styles/frosted.css` — **不是 token，是"按开关改组件外观"的规则**（高斯模糊）。
    它是无层级（unlayered）的，所以压得过 `@layer utilities` —— 这条既要利用、也是最大的坑，
    见下面「高斯模糊」一节

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

> ⚠️ 生成物里那些**故意留着**的硬编码色**不是漏网的**，别顺手"修"成 token：`morphing-tabs`、
> `not-found/{terminal,glitch,spotlight}` 是固定设计（终端窗口、暗场聚光灯），`charts/*` 的调色板
> 与 `chromatic-text-reveal` 的彩虹是组件身份。
>
> `expanding-arrow-button` 的底色**已经** token 化了（原本 `bg-neutral-950 text-white`，现在
> `bg-primary text-primary-foreground`）—— 高斯模糊只淡出 *token*，硬编码的底色打了 `data-slot`
> 默认也只有 blur、没有半透明（**唯一的例外是 `morphing-tabs` 的那两个硬编码表面**：
> 没有 token 可覆盖只能直接写 `background-color`，见「高斯模糊」里的「导航 / 布局」）。
> 它的 **lime 强调块（`bg-lime-300 text-neutral-950`）仍然硬编码**，
> 那是品牌强调、不是表面，别跟着改。

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
- `frosted` / `setFrosted`（高斯模糊开关）、`frostedBlur` / `setFrostedBlur`（半径，单位 px）

- 状态在 `web/src/hooks/theme-settings-provider.tsx` 的 `<ThemeSettingsProvider>` 里（挂在 `main.tsx` 的 `<ThemeProvider>` 内、`BrowserRouter` 外），
  所以**任何组件调这个 hook 拿到的都是同一份**；页面和页面里的 section 可以各调各的。在 provider 外面调会直接抛错
- 日夜交给 next-themes（`.dark` 类），其余维度统一写到 `<html>` 的 data 属性：
  `data-theme`（主题色）/ `data-dark-shade`（灰度）/ `data-background`（背景图）/
  `data-frosted`（高斯模糊），外加 `--background-overlay-opacity`（遮罩**实际生效**透明度，
  开关关掉时就是 0）与 `--frosted-blur`（模糊半径）
- 都挂 `<html>` 而不是页面容器，是因为 beUI 的浮层（popover / menu / tooltip / toast）会 portal 到 `body`
- **不要再在页面里手写 `dataset.xxx`**，一律走这个 hook
- **组件侧只有一个可选的自定义变体：`bgimage:`**（见下面「背景图」一节）。它是个**工具**、
  **没有任何 beUI 组件默认使用它** —— 组件现在就是 beUI 原生样式，没有"跟着开关自动变外观"的机制；
  要改某个组件的外观就传 `className`，要让它透出背景图才挂 `bgimage:`
  （**例外**：高斯模糊是纯 CSS 按 `[data-slot]` 命中的，见下面「高斯模糊」一节）

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
做法全在**机制层**，生成物一个字节都不用碰（这样重装 beUI 也冲不掉）：

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
  （那 33 处在**高斯模糊**那边单独处理了 —— 整元素 `opacity` 会把糊好的层和清晰的页面混在一起，
  见「禁用态」一节；`mask-image` 那 6 处仍然是死的，理由见「物理铁律」）

#### 这一节刻意不做的事

- **不归一化生成物自带的玻璃**：现在只剩 `project-folder` 这类自带 `bg-card/80 backdrop-blur-xl`
  的地方**保持上游写法** —— 那就是它的设计，跟这个开关是两回事。要调就传 `className`，不用动生成物。
  （`animated-toast-stack` 和 `dock` 原来是这一类的，**都收编了**：`bg-card/95` / `bg-card/80`
  那种档位在暗色下就是一块不透明的板，而且上游那个 `backdrop-blur-xl` 不受 `--frosted-blur`
  控制（滑块拉到 0 它还在糊）。前者见「提示条」、后者见「导航 / 布局」）

### 高斯模糊（`data-frosted`）

开关是 `<html data-frosted="true">`（**与 `data-background` 平级、互不依赖**），半径走
`--frosted-blur`。规则全在 `web/src/styles/frosted.css`，命中靠生成物上的 `data-slot` 属性。
现在有四组组件 + 五个单独的，**都是按调试页的 section 一节点出来的**，各自一份「覆盖范围」
小节的表格：

| 组 | 位置 | 处数 | 表面用到的 token |
| --- | --- | --- | --- |
| 按钮家族 | `motion/` 下 10 个文件 | 16 | `--primary` / `--card` / `--muted` |
| 表单控件 | `motion/` 下 21 个文件 | 27 | `--background` 为主，得分档 |
| agent-tools | `agents/` 下 9 个文件 | 12 | 大多是**本来就带 alpha** 的面板 |
| 导航 / 布局 | `motion/` 下 7 个文件 | 10 | 外壳 `--card` / `--muted`；两处**硬编码色**；两个悬停弹层 |
| 弹层：右键菜单 | `motion/context-menu.tsx` | 1 | `--card`，**另外要先拆掉外层的 `filter`**，见下 |
| 弹层：MorphPopover | `motion/popover-morph.tsx` | 1 | `--background`，**同上要拆 `filter`**；四个组件共用 |
| 弹层：通知堆叠 | `motion/notification-stack.tsx` | 2 | 底衬 `--muted` + 卡片 `--background` |
| 弹层：提示条 | `motion/animated-toast-stack.tsx` | 2 | 卡片 `--card`（`/95`），**模糊挂在 `<li>` 上**，见下 |
| 调试页演示框 | `pages/debug/components/agent-tools-section.tsx` | 5 | `bg-muted/40`，本来就够透 → 只模糊 |

#### 为什么不能纯 CSS 命中按钮

beUI 的 `Button` **没有 `data-slot` / `data-variant`**，渲染出来就是个裸 `<button>`（`motion.button`）。
想靠类名签名认按钮全都误伤，实测：

| 候选签名 | 命中 |
| --- | --- |
| `bg-primary` | **19 个文件，只有 9 个是按钮**（`radio` / `tabs` / `checkbox` / `switch` / `bounce-sidebar` / `table/*` 都在用） |
| `select-none` + `font-medium` | **11 个非按钮文件**（`code-block` / `context-menu` / `table-header` / `project-folder` …） |

类名签名还有个更坏的失效方式：beUI 哪天改个类名，规则**静默失效**、没有任何报错 ——
比"重装后被冲掉"更难发现。所以在生成物里加了**一个属性**（见下），其余全靠 CSS。

#### 核心：覆盖 **token**，不要覆盖 `background-color`

这条是本仓库最容易写错的地方。`base.css` / `frosted.css` 里的规则都是**无层级**（unlayered）的，
而无层级声明**压过所有 `@layer`**（含 `@layer utilities`）—— 所以一旦直接写 `background-color`，
它会连 `:hover` 一起压死，按钮的悬停反馈直接消失。上一版就是被这个坑逼得到处用 `!important`。

**例外**（`frosted.css` 里也标了 ⚠️）是给**一点底色都没有**的 slot 现补一层
`background-color`。不补这一层，那个 token 被淡成 62% 也**无处施加**，开了模糊跟没开一样。
本文件里直接写 `background-color` 的一共**四处**：这条例外（两档）、下面「代码 / 输出一律全透明」
那条（往透里写，不是往上盖）、`combobox-trigger` / `multi-select-trigger` 的强压档，
以及 `morphing-tabs` 那两个**硬编码色**（没有 token 可覆盖，见「导航 / 布局」那节）。
补哪一层要跟**同节邻居**对齐：表单控件补 `--background`（暗色 `oklch(0.145)`），
agent-tools 的 `todo-list` 补 `--muted`（暗色 `oklch(0.269)`）—— 一律 `--background`
会让它在暗色下变成一块黑板、跟同节的几个面板不像一家人（实测抓到过）。
这条拆成了**两档**，差别只在"谁能压过谁"：

| 档 | 怎么写 | 谁赢 | 用在 |
| --- | --- | --- | --- |
| 兜底 | 写进 `@layer utilities`，整条选择器套 `:where()`（权重 0） | 元素上**只要带 `bg-*`（组件的或调用方传的都算），utility 就赢**，这层不生效 | 其余所有补底色的 slot |
| 强压 | 无层级 | 压过一切 utility | 只有 `combobox-trigger` / `multi-select-trigger` —— 它们自己写了 `bg-transparent`（一个"空" utility、不是底色） |

分成两档是因为**第一档单独用不够、第二档单独用太狠**，两边都被实测抓到过：兜底档如果也写成无层级，
`ToolApprovalCode` 传给 `AgentCode` 的 `bg-muted/30`、approval-card 传给 `Input` 的
`bg-background/70` 会被无声盖掉（补底色本来就只是兜底）；强压档如果覆盖全体，那两个
`bg-transparent` 的触发外壳永远补不上。**别把这个做法推广到有底色的 slot 上**，也别把兜底档改成无层级。

**改法**是只在按钮身上重定义它用的那个底色 token。产物里（`dist/assets/index-*.css`）：

```css
.bg-primary{background-color:var(--primary)}
.hover\:bg-primary\/90:hover{background-color:color-mix(in oklab, var(--primary) 90%, transparent)}
```

读的是**同一个变量**，所以 hover / `/NN` / 暗色 / 主题色全部自动跟着走，**不需要逐状态规则、也不需要 `!important`**：

```css
html[data-frosted='true'] [data-slot='button'] {
    backdrop-filter: blur(var(--frosted-blur, 12px));
    --primary: color-mix(in oklab, var(--primary-solid) 88%, transparent);
    --card:    color-mix(in oklab, var(--card-solid)    62%, transparent);
    --muted:   color-mix(in oklab, var(--muted-solid)   62%, transparent);
}
```

- `--*-solid` 影子变量是为了**避免自引用**：`--primary: color-mix(… var(--primary) …)` 是同元素上的
  循环引用，整条声明会失效。影子变量定义在 `html` 上，自动跟踪 light / 四档暗色 / 主题色
- **主题色（`--primary`）单独一档，只淡 12%**（`switch` 的开态轨道同）：62% 那点在浅色页面上没问题，
  一到暗色页面，粉 / 蓝这类**有彩度**的底色会被近黑的页面"染"成灰的 —— 看着像掺了黑染料。
  实测不是 `color-mix` 的锅（`in oklab` / `in srgb` / 显式 `alpha 62%` 三种写法渲染逐像素相同），
  就是 62% 太淡。中性表面（`--card` / `--muted` / `--background`）留 62% —— 它们本来就是灰的，淡了只显轻
- 只覆盖这三个，是照 `base.tsx` 四个 variant 实际用的底色来的：`primary`→`bg-primary`、
  `secondary`→`bg-card`、`ghost`/`outline`→`bg-transparent`（本就透明，只吃模糊、底色不动）。
  用不到的 token 覆盖了也无害
- `--primary-foreground` **一个字不碰**，所以主按钮上的文字仍然不透明
- 产物确认（lightningcss 自动加了 `-webkit-` 前缀与 `@supports (color:color-mix(…))` 的降级：
  不支持 `color-mix` 的浏览器里 `--primary` 停在实心值 → 不透明 + 模糊，不会变成"没底色"）：

  ```bash
  f=$(ls dist/assets/*.css | head -1)
  grep -o "html\[data-frosted=true\] \[data-slot=button\]{[^}]*}" "$f"
  ```

- **副作用**：覆盖 `--primary` 会影响该元素上**所有**读它的 utility（`.text-primary{color:var(--primary)}`、
  `.from-primary` …）。四个内置 variant 用的是 `text-primary-foreground`（另一个 token），所以没事；
  但给 `Button` 传 `className="text-primary"` 会得到半透明文字

#### 覆盖范围：按钮家族的 `data-slot="button"`

上面那条规则全靠这个属性命中，所以它是**生成物改动**（重装会丢，探针见上面「引入与维护」第 4 条）。

**覆盖范围 = 导出名以 `Button` 结尾的组件**（客观判据，不用逐个讨论）。`button/` 四个
（`Button` / `ButtonLink` / `StatefulButton` / `MagneticButton` / `MetallicButton`）里只有
`base.tsx` 需要打 —— 其余三个是 `<Button>` 的包装，自动继承。另外 9 个文件**各有自己的根元素**
（beUI 常把一套 variant 表复制进组件里，`action-swap.tsx:147` 就是 `base.tsx` 的一份副本），
所以必须逐处打：

| 文件 | 处数 | 说明 |
| --- | --- | --- |
| `button/base.tsx` | 2 | `<motion.button>` + `<motion.a>`（`ButtonLink`） |
| `action-swap.tsx` | 1 | `-blur` / `-roll` / `-cascade` 三个包装都转发到它 |
| `slide-action-button.tsx` | 2 | 外壳是 `div`（`bg-muted` 的轨道），滑块才是 `button` —— 两个都要，只打滑块的话它采样的是不透明轨道，糊了也看不见 |
| `swap/controls.tsx` | 2 | `FlipButton`（本来就有 Tailwind 的 `backdrop-blur`，会被无层级的本规则顶掉）+ `ActionButton` |
| `animated-sidebar.tsx` | 4 | `MenuButton` / `MenuSubButton` 各有两个根（给 href 就是 `<a>`） |
| `expanding-arrow-button.tsx` | 1 | 它的底色被 token 化了，见下面那一段 |
| `availability-scheduler/icon-button.tsx` | 1 | `bg-transparent`，只有 hover 时可见 |
| `wallet-card/copy-button.tsx` | 1 | 同上 |
| `expandable-control.tsx` | 1 | 同上 |

合计 **10 个文件 16 处**。`<div>` 上那个属性标记的是"这是按钮表面"，不是 DOM 语义 ——
CSS 只认属性名，`slide-action-button` 的轨道用它正好。

**只加属性，不加样式** —— 样式全在 `frosted.css` 里。

**硬编码底色的组件：光加属性没用。** 覆盖的是 token，所以一个写死颜色的按钮加了
`data-slot` 只会拿到 `backdrop-filter`、底色还是实心，等于没效果。`expanding-arrow-button`
就是这个情况（原本 `bg-neutral-950 text-white`），已经**改成 `bg-primary text-primary-foreground`**：
亮色下 `--primary` 就是 `oklch(0.205 0 0)`（近黑）、`--primary-foreground` 是 `oklch(0.985 0 0)`，
跟原来的观感基本一致；代价是它从此跟主题色和暗色档走（sakura 下变粉、暗色下翻白）。
**它的 lime 强调块保持硬编码** —— 那是品牌强调，不是表面。以后遇到同类组件，先看它的底色是
token 还是字面量，是字面量就得先决定要不要 token 化，别打了属性就以为完事。

#### 覆盖范围：表单控件的第二组 `data-slot`（21 个文件 27 处）

按钮那套"覆盖三个 token"照搬不过来。表单控件的表面用到了 **`--background`**，而
**`--background` 和 `--foreground` 同时是文字色** —— 滑块的气泡就是 `bg-foreground text-background`
（填充色当底、页面底色当字）。所以这一组分了三档，**别合并**：

| 这一组的表面是 | 覆盖 | 打了哪些 slot |
| --- | --- | --- |
| `--background` | `--background` | `select-trigger` / `select-content` / `select-morph-trigger` / `select-morph-content` / `combobox-content` / `multi-select-content` / `checkbox` |
| `--muted` | `--muted`，**绝不动 `--background` / `--foreground`** | `select-item` / `select-morph-item` / `combobox-item` / `multi-select-item` / `multi-select-chip` / `slider-track` |
| 单个 | `--primary`：`switch`（开态轨道）；`--card`：`wheel-picker` | — |
| **本来没有底色** | `--background` | `input` / `radio` / `otp-slot` / `combobox-trigger` / `multi-select-trigger` / `ruler-slider` / `wave-slider`，**由 `frosted.css` 现补一层 `background-color`**，见下 |

**打标记的判据只有一条：谁画了底色，就打在谁身上。** 几个不显然的地方：

- `select-item` 打在**条目本身**（选中 / hover 时它自己 `bg-muted`）；但 `combobox-item` /
  `multi-select-item` 打的是**那条滑动的高亮条**（`absolute inset-0 -z-10` 的 `motion.span`）——
  这两家的条目本身是透明的，只有高亮块有底色。`multi-select-chip` 打的是 chip
- **六条滑块的轨道共用一个名字 `slider-track`**（不是一组件一个名字）：它们都是 `bg-muted`，
  共用一条规则。`RangeSlider` / `BubbleSlider` / `FluidSlider` / `InlineSlider` 四条打轨道，
  `RulerSlider` / `WaveSlider` 打根元素
- **本来没底色的那几个：光打标记没用。** `input` / `radio` / `otp-slot` /
  `combobox-trigger` / `multi-select-trigger` / `ruler-slider` / `wave-slider` 自己一点底色
  都没有（只有边框 / 圈 / 格子，或者显式 `bg-transparent`），`--background` 被淡成 62% 也
  **无处施加** —— 表现是"这个控件开了模糊完全没变化"（被实测抓到的就是 Input 那个
  `label="Read only"` 的 Demo）。所以由 `frosted.css` 现给它们补一层 `background-color`
  （**兜底档**，见上面「例外」那张两档表：调用方自己传了 `bg-*` 就让调用方赢）。
  **关掉模糊时这一层不存在**，所以它们的默认外观一个像素都没变
  （顺带纠一条：`backdrop-filter` 在透明元素上确实还在，但它糊的是背景画面本身，
  没有底色去"显影"时肉眼基本看不出来 —— 别指望光靠 blur 出效果）
- `color-swatch` 只吃模糊不补：它 `bg-muted/60` 本来就有透明度
- 唯一没打标记的是 `SignUpForm` 的 `<form>`：它是布局容器、不是控件
- **改之前先看这条**：往 `slider-track` 那一档加 `--background` 或 `--foreground`，滑块气泡上的
  数字、`FluidSlider` 填充里的标签会变成半透明。分档就是为这个存在的
- **副作用同按钮**：这一档里覆盖 `--background` 也会影响该元素上**所有**读它的 utility
  （`.text-background{color:var(--background)}`）。这两家的子树里恰好没有，所以安全 ——
  以后往 `select-content` / `combobox-content` 里加用 `text-background` 的子元素，得回来重挑

#### 覆盖范围：agent-tools 的第三组 `data-slot`（`agents/` 下 9 个文件 12 处）

按调试页 `Agent tools` 一节逐个过出来的。**这一组大半是"本来就写了 alpha"的面板，所以要按档位
判断**（前两组没这个问题：按钮和表单控件的底色都是实心 token）：

> **「代码 / 输出」那一类（pre、输出块、演示框）一律全透明，只留模糊 —— 它们背后总有东西显影。
> 其余按档位：`/80` 那种基本等于实心 → 照样淡；`/75` 及以下的本来就够透 → 只进模糊那条规则；
> 一点底色都没有的 → 兜底档补一层。**
> （三轮都报在这里：`bg-muted/20` 被淡成 12% 是"看着全透"；`bg-muted/80` 不淡则"看着没变"；
> 暗色 + 亮背景图下，代码块上那层淡过的底色**还是一块黑板** —— 见下面「代码 / 输出一律全透明」。）

| slot | 打在哪 | 表面 | 怎么处理 |
| --- | --- | --- | --- |
| `approval-card` | `approval-card/index.tsx` 的外壳 `div` | `bg-muted` 实心 | 淡 `--muted` |
| `image-generation` | `image-generation.tsx` 的 `role="img"` 框（自己带 `isolate`） | `bg-muted` 实心 | 淡 `--muted` |
| `citations-count` | `citations.tsx` 标题右侧的计数徽章 | `bg-muted` 实心 | 淡 `--muted` |
| `tool-result-output` | `ToolResultOutput` 的内容块 | `bg-muted/80` | **全透明**（先归在"淡一档"，实测暗色 + 亮图下仍是黑板，挪到「代码 / 输出」那条） |
| `code-block` | `code-block.tsx` 的外壳 `div` | `bg-muted/80` | 淡 `--muted`（约 50%） |
| `file-diff-content` | `file-diff.tsx` 的内容块 | `bg-muted/80` | 淡 `--muted`（约 50%） |
| `tool-approval` | 外壳 `div` | `bg-muted/20` | 只模糊 |
| `tool-approval-params` | 展开后的参数 `dl` | `bg-background/70` | 只模糊 |
| `citations-mark` | 正文里的行内引用角标 `<a>` | `bg-muted/60` | 只模糊 |
| `image-generation-resolution` | 分辨率徽章 | `bg-background/75` | 只模糊 |
| `todo-list` | `todo-list.tsx` 的外壳 | **一点底色都没有** | 兜底档补 **`--muted`**（不是 `--background`：暗色下 `--background` 会补出一块黑板） |
| `agent-code` | `AgentCode` 的 `pre` | **一点底色都没有，且永远有东西在它背后** | **全透明**（调用方传了 `bg-muted/30` 也顶掉），只吃模糊 |
| `demo-panel` | 调试页里那 5 块 `bg-muted/40` 演示框（agent-code ×2 / agent-disclosure ×2 / citations ×1） | `bg-muted/40` | **全透明 + 模糊**（`/40` 的灰在暗色下同样是黑板；**唯一一个不在 `components/` 下的 slot**，见下面「边界外扩」） |

不显然的几处：

- `agent-code` **只打 `AgentCode` 自己那个 `pre`，也不补底色** —— 它背后总有东西
  （`ToolApprovalCode` 背后是参数面板、调试页里背后是演示框的 `bg-muted/40`），
  `backdrop-filter` 会把那层一起糊掉，自己再画一层反而变成实心板。**别的 slot 别照抄这条**：
  它们背后不一定有东西（`todo-list` 后面就是空的页面）
- `ToolApprovalCode` 的 `bg-muted/30` 是**调用方画的底色**，被上面「代码 / 输出一律全透明」
  那条**无层级**规则顶掉（`agent-code` 在这个组里）—— 不是靠兜底档的"让路"：让路只决定
  **谁来补底色**，而这里要的是**谁都不许画**
- `tool-result` 的**根元素、`agent-disclosure` 整体都没打**：自己一点底色都没有、又只是布局容器
  （同 `SignUpForm` 的 `<form>`）。`tool-result` 里画底色的是 `ToolResultOutput`
- `image-generation` 的分辨率徽章在**画底色的那个框内部**，而那个框自己带 `isolate` —— 这里正是
  想要的效果：徽章糊的是它背后那张图（见「物理铁律」里"组件自己的 `isolate` 要分位置"）
- **硬编码的强调色一律不动**（同 `expanding-arrow-button` 的 lime）：状态徽章的
  `bg-{amber,blue,emerald,rose}-500/10`（approval-card / tool-approval）、code-block 高亮行的
  `bg-blue-500/[0.07]`、file-diff 增删行的 `bg-emerald-500/[0.07]` / `bg-rose-500/[0.07]` ——
  都是 7~10% 的语义色叠层（"这一段是新增"），不是表面，本来就透

#### 边界外扩：调试页的演示框也算表面（`demo-panel`）

「谁画了底色就打谁身上」这条在 `AgentCode` 上撞了墙：那个 `pre` 自己**一个底色都没有**
（也不该有，加了就成实心板），而给它显影的那层底色是**调试页写的**演示框 `bg-muted/40` ——
用户报的"agent-code 的背景依然不是 blur"，指的就是这块演示框。

所以把 `agent-tools-section.tsx` 里那 5 块 `bg-muted/40` 打上 `data-slot="demo-panel"`：

- **只进模糊那条规则**，不淡底色：`/40` 本来就够透（按上面那条档位判据）
- `agent-disclosure` 那两块**把底色搬到了外层 div**：`AgentDisclosure` 自己必须留着
  `data-slot="agent-disclosure"`（`clip-path` 那条规则认它），而**一个元素只能有一个 `data-slot`**
- **代价**：演示框自己成了 backdrop root，框里的标记只能采样框内的画面（同「嵌套的模糊不叠加」）。
  框内 `agent-code` 的 `pre` 因此采不到外面的画面了 —— 但它本来就透明，靠外壳显影即可，
  肉眼看不出差别。**实测过**：棋盘格里的 `bg-muted/40` 盒子，打标记的那块被抹平、同 class
  没打标记的那块棋子清清楚楚
- **别把这个 slot 用到产品组件上**：它只为"调试页的演示框"存在，作用域是
  `pages/debug/components/`。`buttons-section.tsx:371` 那块 `bg-muted/40` 是 `Liquid`
  的胶囊底（填充由 SVG filter 画），**没打**：那是另一节的表面，要收得单独过一遍那节

#### 弹层：右键菜单（`context-menu-content`）

`ContextMenuContent` 的面板是 `createPortal` 到 `body` 的，**在 `motion/context-menu.tsx` 里**，
所以它是唯一一个"打标记 + 一条额外规则"的 slot：

- **面板**：`role="menu"` 那个 `motion.div`，`bg-card` → 淡 `--card` + 模糊（同 `wheel-picker`）
- **外层 wrapper**（`data-context-menu-portal`，`context-menu.tsx` 自己就带这个属性，**不用加**）
  挂着 `[filter:drop-shadow(0_18px_28px_rgba(0,0,0,0.2))]` —— **`filter` 是 backdrop root 的触发器**，
  面板的 `backdrop-filter` 只能采样这个 wrapper **内部**的画面，而 wrapper 里除了面板本身什么都没有
  → 糊了个空气。这条**实测过**（30px 棋盘格三格对照：只有 slot 没有 portal 属性的那格，大格子
  照样清清楚楚；两样都有的那格被抹成均匀灰）
- 所以 `frosted.css` 里多了一条 `[data-context-menu-portal] { filter: none }`，并把影子改挂到面板上
  （`box-shadow: 0 18px 28px rgb(0 0 0 / 0.2)`，圆角矩形上与 `drop-shadow` 视觉等价）。
  无层级 → 压得过 `[filter:…]` 那个 utility（产物里它在 `@layer utilities`），**不用 `!important`**

不显然、而且**跟 `agent-disclosure` 相反**的一点：面板自己身上由 framer-motion 写的
`clip-path: inset(0 0 0 0 round 12px)` **不用管**。`clip-path` 只挡**后代**的 backdrop 采样，
而面板自己就是带 `backdrop-filter` 的那层，它采的是外面的页面（实测：只保留 clip-path 的那一格
照样糊）。所以这里**不用牺牲 morph 动画**，跟 `agent-disclosure` 那条 `clip-path: none !important`
不是一回事 —— 那边是"没底色的容器带 clip-path，挡住的是后代"。

⚠️ 同一个坑还有一处：`motion/popover-morph.tsx` 挂着
`[filter:drop-shadow(0_10px_18px_rgba(0,0,0,0.14))]`，里面若放打了标记的表面同样糊不了。
**已于本轮一并处理**（`morph-popover-content`），见下面「导航 / 布局」那节 —— 处理方式与本条逐字相同。

#### 通知堆叠（`notification-stack` + `notification-stack-card`）

`NotificationStack` 是个 `motion.button`，里面两层各打一个标记，token 不一样：

| slot | 打在哪 | 底色 | 处理 |
| --- | --- | --- | --- |
| `notification-stack` | 卡片**下面那层** `rounded-3xl bg-muted` 的底衬 | `--muted` 实心 | 淡 `--muted` + 模糊 |
| `notification-stack-card` | 每一张卡片（`bg-background`） | `--background` 实心 | 淡 `--background` + 模糊 |

- 两个都要打：底衬是折叠态看到的那个"背景"，卡片是展开态看到的主体。只打底衬的话，
  展开后几张不透明的卡片就成了一块黑板（同 `tool-result` 那次）
- 卡片上由 framer-motion 写的 `clip-path: inset(0px …px round 16px)` **不用管**（同右键菜单：
  面板自己就是带 blur 的那层，clip-path 只挡后代）
- **没打的**：`items` 为空时的那个 `bg-muted/70` 空状态（另一个分支、调试页看不到；
  按档位判据 `/70` 只该加模糊，真要收得单独给它一个 slot）；卡片内部的图标徽章
  （`bg-muted` / `bg-muted/60`）和操作胶囊（`bg-muted/80`）—— 它们是卡片**上面**的小件，
  背后是卡片不是页面，等真看着不顺眼再收

#### 提示条（`toast` + `toast-stack-item`）

`AnimatedToastStack` 的卡片上游本来就带玻璃（`bg-card/95 … backdrop-blur-xl`），但 95% 的
底色把它盖死了 —— 就是"不透明背景"的观感。这个**不能只淡底色**：

- 卡片外面的 `<li>` 上有 framer-motion 写的 `filter: blur(0px)`（入场的"糊着浮现"动画，
  收尾值不是 `none`，照样是 backdrop root）→ 卡片的 `backdrop-blur-xl` 采不到页面。
  **实测**（30px 棋盘格）：只淡 `--card` 那格大格子看得见（blur 是死的）
- 改法是**把模糊挂到 `<li>` 自己身上**（`data-slot="toast-stack-item"`），不是顶掉它的 `filter`：
  元素自己的 `filter` 不挡自己的 `backdrop-filter`，所以**入场的模糊动画保住了**
  （顶掉就没了，同 `agent-disclosure` 那种代价）。卡片只负责淡 `--card` + 当那层"显影"
- 卡片自己那条上游 `backdrop-blur-xl` 用 `backdrop-filter: none` 收掉：它采的是已经糊过一遍的
  li 内部，叠上去是两遍模糊、半径也不受 `--frosted-blur` 控制（**实测**：不收的话滑块拉到 0
  它还在糊）。这也是 `animated-toast-stack` 从"自带玻璃、不归一化"那组里挪出来的原因
- 顺带量到一条负面结论：li 上的 `will-change: transform` **不是** backdrop root 触发器
  （只顶掉 `filter` 的那一格已经能糊了）

#### 导航 / 布局（`motion/` 下 7 个文件 10 处 + `morph-popover-content`）

| slot | 打在哪 | 底色 | 处理 |
| --- | --- | --- | --- |
| `morphing-tabs` | 外壳 `div` | **硬编码 `bg-[#292929]`** | 直接写 `background-color`（62%）+ 模糊 |
| `morphing-tabs-panel` | 面板 `div` | **硬编码 `bg-[#fafaf8]`** | 同上 |
| `expandable-tabs` | 外壳 `motion.div` | `bg-card` | 淡 `--card` + 模糊 |
| `bouncy-accordion-item` | 每一行的 `motion.div` | `bg-card` | 淡 `--card` + 模糊 |
| `swipeable-list` | 外壳 `div` | `bg-muted` | 淡 `--muted` + 模糊 |
| `swipeable-list-item` | 滑的那一行 | `bg-card` | 淡 `--card` + 模糊 |
| `dock` | 外壳 `div` | `bg-card/80` + **上游就有 `backdrop-blur-xl`** | 淡 `--card` + 模糊（把半径收归 `--frosted-blur`） |
| `breadcrumb-link` / `breadcrumb-ellipsis` | 可悬停的 `<a>` / `<button>` | `hover:bg-muted/60`（≤75%） | 只模糊 |
| `tooltip-surface` | 提示气泡 | `bg-background` | 淡 `--background` + 模糊 |
| `morph-popover-content` | MorphPopover 的面板 | `bg-background` | 淡 `--background` + 模糊 + **拆掉 portal 的 `filter`** |

不显然的几处：

- **两个硬编码色只能直接写 `background-color`**（本文件的第四类例外）。它们一点 token 都没有，
  不淡一层 blur 就被自己挡死（**实测**：只加 blur、不淡底色那一格与"完全没开"逐像素相同）。
  之所以敢这么写：**这两个表面自己都没有 `:hover` 底色** —— 交互反馈在子元素上
  （未选中的 tab 是 `group-hover:bg-white/[0.06]` 的那个 `span`）。给有 `:hover` 底色的表面
  这么写就会连悬停反馈一起压死，那正是「核心」那节警告的事。62% 与 token 组同档
- `dock` 上游自带 `backdrop-blur-xl`：本文件的 `backdrop-filter` 是无层级的，**顶掉它**，
  半径改由 `--frosted-blur` 控制（**实测**：`--frosted-blur: 0` 那一格棋子露出来了、
  同 class 不打的对照格照样是糊的；`bg-card/80` 淡成 62% 后均值明显变亮）。这是
  「不归一化生成物自带的玻璃」那一条里，继提示条之后**第二个收编**的
- `morph-popover-content` 与右键菜单同款坑、同款处理：`[data-morph-popover-portal] { filter: none }`
  + 面板自己挂 `box-shadow`。**实测 A/B**（30px 棋盘格）：带 `data-morph-popover-portal` 的那格
  极差 1（均匀），同款 wrapper 只把属性名换掉的那格极差 91（棋子清清楚楚）。
  它是**共用**组件 —— 面包屑的省略号、`ai-sidebar` / `prompt-input` / `availability-scheduler/copy-menu`
  都用它，所以一处标记覆盖四处弹层。面板自己身上的 `clip-path`（morph 的裁切）照旧不用管
- `breadcrumb-link` 的标记写在 `linkProps` **对象**里（`"data-slot": "breadcrumb-link"`），
  不是 JSX 属性：它可能是 `render` 出去的 router `<a>`，只有写在对象里两条路径才都带得上
  （**例外的写法**，别当成通用做法——JSX 属性那边一行更直白）
- **没打的**：几个选中态胶囊（`expandable-tabs` 的 `bg-foreground/10`、`dock` 的 `bg-muted/60`）、
  `swipeable-list` 滑开后露出的操作按钮、`breadcrumb-page`（当前页，自己没有底色）。
  理由同「档位判据」+ 下面那条埋在里面也糊不出的情况：它们都在带 `backdrop-filter` 的父元素
  内部，自己再挂 blur 也采不到页面

#### 物理铁律

- **祖先带 `mask` / `filter` / `opacity < 1` / `isolation: isolate` 会形成 backdrop root，
  后代的 `backdrop-filter` 只能采样这个 root 内部的画面**，而这类容器通常自己没有底色
  → 糊了等于没糊。症状是"组件自己写对了但完全没效果"，只看组件本身永远查不出来。
  ⚠️ 关键区分：backdrop root 只挡**后代**的采样，**元素自己**带 `backdrop-filter` 时采的仍是外面的
  页面 —— 所以 `clip-path` / `filter` 挂在**带 blur 的那个元素自己**身上没事，挂在**它的祖先**
  身上才是致命的（右键菜单的面板就是后者，见上）。
  分三种情况看：
  - **调试页 `<main>` 的 `isolate` 是对的、别动**：背景图那两层（`-z-20` / `-z-10`）就画在
    `<main>` 里面，所以它们在同一个 root 内、采得到（那个玻璃 header 就是靠它）
  - **`Demo` 定高块原来也用 `isolate`，是纯多余**：框里没有背景图层，后代什么都采不到 ——
    整页 **61 个**定高 Demo 里的模糊全是死的。已改成 `relative z-0`（`z-index: 0` 一样造
    stacking context，但**不在 backdrop root 的触发列表里**）。判断"能不能换"就看目的：
    要的只是关住负 `z-index` / 造层叠上下文，`z-0` 就够；只有真要隔离混合模式时才用 `isolate`
  - **组件自己的 `isolate` 要分位置**：`image-generation` / `tabs` / `morphing-tabs` /
    `popover` / `expandable-action-bar` / `swipeable-list` / `adaptive-stepper` 都有。
    加在**画底色的那个元素自己**身上没事（它自己的模糊照常采样父 root），
    加在**没底色的容器**上会把后代的模糊全部吃掉。
    （`morphing-tabs` 与 `swipeable-list` 是前一种，但它们的**后代**另有一层约束，见下条）
  - **嵌套的模糊不叠加**：`backdrop-filter` 自己也在触发列表里，所以**里层只能采到外层内部的
    画面**。`tool-approval-params`（在 `tool-approval` 外壳里）、approval-card 里的 `input`
    就是这种 —— 它们对着外层那点几乎空白的底色模糊，等于没糊，但底色照样是半透明的，
    看着就是"透、但不糊"。想让它真糊只能把内层的底色撤掉、只留外层。
    **本轮在浏览器里逐像素比过了**：`morphing-tabs` 的面板、`swipeable-list` 的行就是这种
    埋在里面的表面，把外壳的 `isolate` 换成 `z-index: 0`（放开里层、让它自己去采页面）
    前后各截一张棋盘格，两张 PNG **md5 完全相同**（`d45c441e…`）。
    原因是外壳那层本来就是"要么不透明、要么已经把页面糊过一遍"铺在下面，里层贴着的背影
    本来就是均匀的 —— 里层**那一层自己的 blur 有没有生效都看不出来**，所以没必要为此去动
    生成物里的 `isolate`（里层的底色照样要淡，那才是它"半透明"的来源）
  - **`clip-path` 也在触发列表里，而且最容易漏**（`mask` 的同族）。`AgentDisclosure` 展开时
    由 framer-motion 往 `style=""` 写 `clip-path: inset(0 0 0% 0)` —— 一个视觉上什么都没裁的
    值，照样让它变成 backdrop root，于是**折叠里的四个表面全都糊不了**（ToolResult 的输出块、
    FileDiff 的内容、ToolApproval 的参数面板、ToolApprovalCode 的 pre）。已用一条
    `clip-path: none !important` 顶掉（见 `frosted.css`）——内联样式只有 `!important` 压得住；
    代价是开模糊时这个折叠没有"擦出"动画了，高度 + 透明度还在。**实测过**（棋盘格对比截图：
    套 `clip-path` 的格子清晰、顶掉之后被抹平）。注意这里**得**顶掉，是因为 `AgentDisclosure`
    是个没底色的容器、挡住的是**后代**；`clip-path` 落在带 blur 的元素自己身上不用管（右键菜单）
  - 同类还有：`popover` / `popover-morph`（morph 的 clip 是功能本身）、`tabs` 的滚动遮罩、
    `action-swap:182` 的 `inset(0 -999px)`、`message-bubble` 的渐隐 mask、
    `agent-activity` / `range-slider-ruler` 的 `mask-image`。**这些先别动** —— 它们的 clip/mask
    是设计的一部分，且里面目前没有打了标记的表面。真要往里放表面，先判断 blur 是不是死的
- **弹层不要把 `backdrop-filter` 加在容器本体上**：它会改变 `position: fixed` 后代的包含块
  （beUI 有 12 个组件用 `@floating-ui/dom` 定位，二级菜单的定位基准会从视口变成父菜单，再被裁掉）。
  要模糊就挂 `before:` 伪元素上，且 **`rounded-[inherit]` 不能省** —— 伪元素默认是矩形，
  圆角面板上会露出四个直角。对按钮不适用（按钮没有 fixed 后代），以后做弹层时记得

#### 禁用态：`opacity` 和 `backdrop-filter` 不能共存

**同属"物理铁律"这一类，而且症状最像"规则没生效"**：元素自己带 `backdrop-filter` 时，再叠一层整元素
`opacity < 1`，等于把"**糊好的那层**"和背后**没糊**的页面按比例混在一起 —— 50% 就是一半清晰
一半糊，肉眼直接判成"这个控件没糊"。用户报的正是禁用态的 `Select`（`select.tsx` 的
`disabled:pointer-events-none disabled:opacity-50`）。

**实测过**（棋盘格对照：`backdrop-filter` + `opacity: .5` 那一格，和"只有半透明底色、完全没 blur"
的那一格渲染几乎一致；`opacity: 1` 的对照组棋子被彻底抹平）。

所以模糊态下用 **token 压淡**替代整元素 `opacity`：

```css
html[data-frosted='true'] [data-slot]:disabled {
    opacity: 1;                                          /* 把 50% 收回来，blur 才是全强度 */
    --background: color-mix(in oklab, var(--background-solid) 30%, transparent);
    /* --card / --muted 同样 30%；主题色 --primary 要按它自己那档折半 → 44% */
    --primary: color-mix(in oklab, var(--primary-solid) 44%, transparent);
    --foreground: color-mix(in oklab, var(--foreground-solid) 50%, transparent);
    /* --border / --muted-foreground 同样 50% */
}
```

- 观感同样是"变灰变淡"：底色系的淡一档、前景 / 边框 / 次级文字淡一半，但**模糊是全强度**的。
  每个 token 取的是**它自己启用态那一档的一半**（中性 62% → 30%，主题色 88% → 44%）——
  主题色别跟着写 30%，那样比原来的 `opacity: .5` 还淡，禁用按钮会淡过头
- 用到的 `--foreground-solid` / `--muted-foreground-solid` / `--border-solid` 三个影子变量
  是**必须**加的：不写就会出现 `--foreground: color-mix(… var(--foreground) …)` 这种同元素
  自引用，整条声明静默失效（连报错都没有）
- ⚠️ **只认 `:disabled`**（原生表单元素）。用**条件类名**表达禁用的盖不到 ——
  `options.disabled && "opacity-50"` 那种（几条 RangeSlider、`otp-input`、`adaptive-stepper`、
  `bouncy-accordion`、`expandable-control`）元素是 `div`，CSS 无从判断。
  真遇到就单独处理（给它加 `data-disabled` 之类的属性），**别去按类名猜**
- 关掉模糊时这条规则整条不生效，`disabled:opacity-50` 照旧

#### 边界：什么算"按钮"、什么不算

判据是**导出名以 `Button` 结尾**（见上面那张表，10 个文件）。**不是**"所有自绘的
可点元素"：`overflow-actions` / `adaptive-stepper` / `breadcrumb` / `swap/token-picker` 这些
也长着 `bg-muted`，但它们是**列表行 / 选择器 / 折叠触发器**，不是按钮 —— 打上去只会让它们在
开模糊时莫名其妙变半透明。要收谁进来，先决定它算不算按钮，别按"有没有底色"来筛。

（表单那一组正好相反：**收谁**是照调试页 `Forms & inputs` 一节逐个过出来的，
**打在哪**才用"这个元素画了底色没有"来定。两个问题的判据不一样，别互相套。）

#### 这一版不做

- 不给 `Button` 加 `data-variant`：不需要 —— 覆盖 token 这条路不用知道它是哪个 variant。
  哪天真需要按 variant 区别对待再加
- **表单里没打的**：`SignUpForm` 的 `<form>`（布局容器，不是控件）；`ColorSelectorItem` 的
  `bg-muted/60` 与 signup-form 的密码强度条 `bg-muted-foreground/20` —— 本来就只有 60% / 20%，
  再乘 62% 只会更淡，跟"不透明改半透明"这条规则无关
- 滑块的**填充和把手**（`bg-foreground` / `bg-background`）保持实心：它们是"值"，不是"表面"。
  要连它们一起淡，得先给它们一个跟文字色脱钩的 token
- **agent-tools 里没打的**：`tool-result` 的根元素、`agent-disclosure`（没底色的布局容器，
  同 `SignUpForm` 的 `<form>` —— 调试页那两块演示框的底色是搬到了**外层** `demo-panel` 上，
  组件本身照样没打）；`tool-approval` 那两个按钮（"Allow once" / "Always allow"）
  —— 它们是组件内部的 `<motion.button>`，不是导出名以 `Button` 结尾的组件，按上面「边界」
  那节的判据不收（顺带："Allow once" 是 `bg-foreground text-background`，淡 `--foreground`
  会连它的文字一起变半透明，收进来之前得先给它一个独立 token）
- 旧的两份 skill 不重新引入（特性缩到一个文件装得下），要回看
  `git show c8d485b:.claude/skills/{frosted-glass,background-image}/SKILL.md`

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
