---
name: websocket
description: WebSocket（长连接）的 Skill。当需要加一条长连接业务、加一个事件、写后端 ws 路由、在组件里接实时推送（聊天 / 进度流 / 通知），以及排查"连不上""send 一直超时""一直重连""事件不触发""被 401 挡在升级"时使用。覆盖 shared/protocol 的帧、后端 Elysia `.ws()` 路由、前端 `WebSocketClient` 与 `useWebSocket`、心跳 / 重连 / 鉴权。
---

# WebSocket（长连接）

分工先记住，**只有一份帧，两边的活不重叠**：

| 层 | 文件 | 干什么 |
| --- | --- | --- |
| 契约 | `shared/protocol/ws-{request,response,events}.ts` | 帧的形状、`WsRequest.parse`、`WsResponse.ok/fail/push`、`WS_PING` / `WS_PONG` |
| 负载形状 | `shared/<feature>/{dto,vo}/` | 事件里那坨业务数据的 dto / vo（纯字段构造） |
| 后端 | `server/src/modules/<feature>/` 里的 `.ws()` 路由 | 解析请求、回帧、推送；错误经 `common/response/ws-failure.ts` |
| 前端传输 | `web/src/api/websocket.ts` | 重连 / 心跳 / 请求应答 / 订阅，**业务代码不要自己 `new WebSocket`** |
| 前端业务 | `web/src/api/<feature>/<feature>.ts` | 每个事件一个函数，内部用上面的客户端 |
| 前端组件 | `web/src/hooks/use-websocket.ts` | `useWebSocket({ handlers })` 收推送，`connected` 控 UI |

硬性约束见 `.claude/rules/backend.md` 的「WebSocket」「共享层」与 `.claude/rules/frontend.md` 的「WebSocket」；这里是"怎么做完一件事"。

## 帧：照抄，别自己发明

| 方向 | 类 | 形状 |
| --- | --- | --- |
| 客户端 → 服务端 | `WsRequest` | `{ id: string \| null, event: string, data: unknown }` |
| 服务端 → 客户端 | `WsResponse` | `{ id: string \| null, event: string, code: number, message: string, data }` |

- `code` 与 HTTP 的 `ApiResponse` **同一套**：`CODE_OK`（0）成功，其余是服务端异常的 `code`
- `id` 由客户端生成、服务端原样带回：它让一个连接上并发多个请求各回各家。客户端不关心应答（单向通知）时是 `null`，服务端主动推送也是 `null`
- 只走 **JSON 文本帧**，不支持二进制
- 事件名 `<feature>.<action>` 全小写；`WS_PING` / `WS_PONG` 是协议保留的

## 加一条长连接业务

1. **定事件名**：`chat.send`、`chat.message`、`terminal.output`。响应和推送**用不同名字**（原因见「排查」第 4 条）。
2. **负载形状进共享层**：`shared/<feature>/dto/*.dto.ts`（客户端要发的）、`shared/<feature>/vo/*.vo.ts`（响应里出现的），类 + 纯字段构造。客户端不需要看到的内部形状留在 `server/src/modules/<feature>/controller/{dto,vo}/`。
3. **后端加路由**（下节骨架），模块装配在 `main.ts` 里 `.use()`。
4. **前端加业务方法**（`web/src/api/<feature>/<feature>.ts`），组件里用 `useWebSocket()`。
5. 要显示给用户的东西（连接中 / 已断开 / 出错）**走 i18n**，每个语言文件成套加 key —— 见 `.claude/rules/frontend.md` 的「文案（i18n）」。

### 后端骨架

```ts
import { Elysia } from 'elysia'

import type { ChatSendDto } from '@shared/chat/dto/chat-send.dto'
import { WsRequest } from '@shared/protocol/ws-request'
import { WsResponse } from '@shared/protocol/ws-response'
import { WS_PING, WS_PONG } from '@shared/protocol/ws-events'

import { ApiException } from '../../../common/exception/api-exception'
import { BadRequestException } from '../../../common/exception/http-exceptions'
import { wsFailure } from '../../../common/response/ws-failure'
import { LogService } from '../../../common/service/log-service'

export class ChatController {
  get routes() {
    return new Elysia({ prefix: '/api' }).ws('/chat/ws', {
      open(ws) {
        // ws.data.auth 来自 authInterceptor（升级请求也走它），路径在 /api/ 下才有人管
        ws.send(WsResponse.push('chat.message', { welcome: true }).toFrame())
      },
      message(ws, message) {
        // 泛型是"调用点的承诺"，data 内部的校验自己做（和 HTTP 的 body as XxxDto 同理）
        const request = WsRequest.parse<ChatSendDto>(message)

        if (request === null) {
          ws.send(wsFailure(null, new BadRequestException('invalid frame')).toFrame())
          return
        }

        if (request.event === WS_PING) {
          // 必做：客户端靠它判断连接还活着
          ws.send(WsResponse.push(WS_PONG, null).toFrame())
          return
        }

        try {
          switch (request.event) {
            case 'chat.send': {
              // 推送是推送，应答是应答：两个事件名
              const saved = this.service.save(request.data, ws.data.auth)

              ws.send(WsResponse.ok(request, saved).toFrame())
              ws.send(WsResponse.push('chat.message', saved).toFrame())
              return
            }
            default:
              throw new BadRequestException(`unknown event ${request.event}`)
          }
        } catch (error) {
          // 非业务异常记日志（细节不外泄），业务异常直接透出 code / message
          if (!(error instanceof ApiException)) LogService.error('chat', error)
          ws.send(wsFailure(request, error).toFrame())
        }
      },
      close(ws, code) {
        LogService.debug('chat', 'closed', code)
      },
    })
  }
}
```

（`this.service` 就是模块里那个 `service/chat.service.ts`，和 HTTP 路由共用一个 —— ws 路由是**同一条转调链**，不要在 handler 里堆业务逻辑。）

- **解析失败不要抛异常、也不要静默**：回一帧 `wsFailure(null, new BadRequestException('invalid frame'))`，或者直接 `ws.close(1003)`（协议错误码）。`WsRequest.parse<T>` 的泛型是**调用点的承诺而不是校验**，`data` 内部要严格校验就自己再收一道（和 HTTP 的 `body as XxxDto` 同一套写法）
- **升级请求的鉴权与 HTTP 一样**（`authInterceptor` 覆盖 ws），放 `/api/*` 下就自动受保护、无 token 直接升不上来；放别的路径**没有任何鉴权**，别顺手写成 `/ws`
- 控制器的 `{ prefix: '/api' }` **对 `.ws()` 同样生效**（已实测）：`new Elysia({ prefix: '/api' }).ws('/chat/ws', …)` 的地址是 `/api/chat/ws`，正好落在受保护范围内
- 需要"某个人不在线也要收到"的东西**别只靠 WS**：落库 + 前端连上后拉一次历史

**广播**用 topic（Elysia 自带，`ws.subscribe(topic)` + publish）。两种 publish 的差别是实测出来的，很容易搞错：

| 调用 | 该 topic 的其他订阅者 | 发送者自己 | 未订阅的连接 |
| --- | --- | --- | --- |
| `ws.publish(topic, frame)` | 收到 | **收不到** | 收不到 |
| `app.server.publish(topic, frame)` | 收到 | **收到** | 收不到 |

想让"发送者也在内"（比如聊天室把自己的消息也当成一条消息渲染）就用 `app.server.publish`，或者自己再 `ws.send` 一份。单播一律 `ws.send`。

### 前端业务方法 + 组件

```ts
// web/src/api/chat/chat.ts
import type { ChatSendDto } from '@shared/chat/dto/chat-send.dto'
import type { ChatMessageVo } from '@shared/chat/vo/chat-message.vo'

import { getWebSocketClient } from '@/api/websocket'

export function sendChatMessage(body: ChatSendDto): Promise<ChatMessageVo> {
  // 事件名与后端一字不差
  return getWebSocketClient().send<ChatMessageVo>('chat.send', body)
}

export function notifyTyping(): void {
  getWebSocketClient().notify('chat.typing')   // 单向帧，不等应答
}
```

```tsx
// 组件里
const { connected, send } = useWebSocket({
  // 只在事件名集合变化时重新订阅，内联字面量不会反复解绑；处理函数永远是最新闭包
  handlers: {
    'chat.message': (message: ChatMessageVo) => setMessages((prev) => [...prev, message]),
  },
})

<Button disabled={!connected} onClick={() => sendChatMessage({ text })} />
```

- 连接是**全应用共享**的（`getWebSocketClient()`），多个组件 `useWebSocket()` 不会各开一条
- 挂载自动连、卸载**不断开**；要断就在该断的地方 `getWebSocketClient().disconnect()`（退出登录、调试开关），它会**停止重连**
- `useWebSocket()` 返回的 `send` / `notify` 是传输层的（裸事件名）；业务上更推荐按上面的写法封成 `api/<feature>/<feature>.ts` 里的函数，这样"有哪些事件"在一个文件里看得全
- 手动订阅动态事件名用返回的 `on(event, handler)`；要看连接状态就用 `status`（`idle` / `connecting` / `open` / `reconnecting` / `closed`）或 `connected`

## 心跳 / 断线 / 重连的语义

| 行为 | 默认 | 说明 |
| --- | --- | --- |
| 心跳 | 25s | 客户端发 `WS_PING`，服务端必须回 `WS_PONG`；**任何**收到的帧都算"活着" |
| 判死 | ~3 个周期（约 75s） | 一直没收到任何帧就主动断开重连（半死的 TCP 不会自己报错） |
| 重连 | 指数退避 500ms → 15s | 带抖动；只有 `disconnect()` 才会停 |
| 请求超时 | 15s | `send()` reject，`code === WS_CLIENT_ERROR`（负数 = 客户端侧失败） |
| 断开时在途请求 | 立刻 reject | 不等超时 |

- 重连**不会补发**断开时没送出去的帧：要"送到且只送一次"就自己带业务序号 + 落库 + 前端去重，别指望传输层
- `send()` 在没连上时**直接 reject**（不是排队），所以按钮该用 `connected` 控住；想排队是业务决定，别改客户端
- 开发排查时给客户端传 `log: true`（`new WebSocketClient({ path, log: true })`）能看到每一帧收发

## 鉴权

- cookie 模式：浏览器自动带 cookie，前端**什么都不用做**
- localstorage 模式：客户端自动在 URL 拼 `?token=`（浏览器不能给 WS 加自定义头）
- 后端只在**升级请求**上接受 query 里的 token（`isUpgrade()` 限定），普通请求拼 URL 不生效 —— 这是故意的
- 业务代码**不要自己读 token**，也不要自己 `new WebSocket` 拼 URL

## 验证

```bash
bun run typecheck && cd web && bun run lint
```

"类型都对"证明不了 WS 能通，**一定真连一次**。最省事的是临时脚本：一个进程里起一个真的 Elysia app（带上 `authInterceptor` 与你的 ws 路由），再用真的前端客户端驱动，跑完把临时文件删掉：

```ts
// web/__ws-check.ts —— 临时文件，跑完删
const store = new Map<string, string>()
;(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
}

const { createCheckApp } = await import('../server/__ws-check-app') // 你的临时路由（带 authInterceptor）
const { AuthService } = await import('../server/src/modules/auth/service/auth.service')
const { WebSocketClient } = await import('./src/api/websocket')

// localstorage 模式下客户端从 localStorage 取 token 拼进 URL，所以先塞一个进去
const login = await new AuthService().login({ username: 'admin', password: 'admin' })
localStorage.setItem('auth_token', login.token)

const app = createCheckApp().listen(5199)
const client = new WebSocketClient({ path: 'ws://localhost:5199/api/chat/ws', heartbeatInterval: 300 })

const pushes: unknown[] = []
client.on('chat.message', (data) => pushes.push(data))
client.connect()

// send() 在没连上时直接 reject，所以先等 open；**一定要带超时**，否则连不上时脚本就只是"卡住"
const deadline = Date.now() + 3000

while (client.status !== 'open' && Date.now() < deadline) {
  await new Promise((resolve) => setTimeout(resolve, 20))
}

if (client.status !== 'open') {
  console.error('连接没建立，status =', client.status) // 最常见：临时 app 漏了控制器的 { prefix: '/api' }
  process.exit(1)
}

// 至少断言这四件事
console.log('1 应答对得上 id:', await client.send('chat.send', { text: 'hi' }))
await new Promise((resolve) => setTimeout(resolve, 200))
console.log('2 推送到了:', pushes)
console.log(
  '3 错误帧是 code 不是异常:',
  await client.send('chat.nope').then(
    () => 'FAIL',
    (error: { code: number }) => error.code,
  ),
)
console.log('4 心跳被服务端收到（看后端日志里有没有 PONG 回帧）')

client.disconnect()
await app.stop()
process.exit(0)
```

```bash
cd web && VITE_AUTH_MODE=localstorage bun run __ws-check.ts && rm web/__ws-check.ts
```

跑临时脚本的四个坑（都踩过）：

- **临时 app 要和真控制器一样带 `{ prefix: '/api' }`**：漏了的话地址是 `/chat/ws` 而不是 `/api/chat/ws`，升级请求找不到路由，表现是"客户端卡在 connecting、后端毫无动静"（所以上面那个等待循环必须带超时）
- `bun run xxx.ts` 会**另起子进程**，`kill $!` 杀不掉，端口会被留在那儿 —— 而且下次连上的其实是**上一个进程**，会出现"改了没生效"的假象；用 `pkill -f __ws-check` 收尾，跑完确认端口空了
- 前端的请求层写的是根相对路径（`/api/...`），浏览器按 `location` 解析、Bun 里没有 `location`；要连 HTTP 一起测就给临时脚本补一个 `fetch` 包装
- localstorage 模式记得先 `localStorage.setItem('auth_token', …)`（上面那两行），否则升级会被 401 拒掉 —— 这条排查起来最费时间，因为症状只是"连不上"

## 排查

1. **一直 `connecting` / `reconnecting`，后端毫无日志** → 大多数是**开发时 vite 代理没开 ws**：`web/vite.config.ts` 的 `/api` 代理要有 `ws: true`（删了它，升级请求会停在 vite 上）。
2. **升级被拒（401 / 立刻 close）** → 路径在 `/api/*` 下但没带 token。cookie 模式看有没有登录；localstorage 模式看 `getToken()` 是不是 null（没登录 / 退出登录清掉了）。
3. **连上了但 `send()` 永远超时** → 后端没回帧（忘了 `ws.send(...toFrame())`），或事件名两边不一致，或返回时**没带 id**（手拼了对象而不是 `WsResponse.ok(request, data)` —— 客户端按 id 对上号才会 settle）。
4. **推送收到了，`handlers` 不触发** → 带 `id` 的帧如果 id 对得上某个在途 `send()`，会被当应答**消化掉**，不走 handler。所以别用同一个事件名既做应答又做推送，把响应叫 `chat.send`（应答）、推送叫 `chat.message`。
5. **广播"有的人收不到"** → 先看那个人有没有 `ws.subscribe(topic)`（topic 是隔离的，没订阅就是收不到）；再看是不是**发送者自己**收不到 —— 那是 `ws.publish` 的正常行为，要含发送者就换 `app.server.publish`。
6. **每 ~75s 被断开重连一次** → 后端没实现 `WS_PING → WS_PONG`，或用了 `'ping'` 字面量而客户端用的是 `WS_PING`。心跳是协议的一部分，不是可选项。
7. **升级时 `?token=` 不生效** → 它只对升级请求开口（普通请求拼 URL 会被忽略），而且前端只在 localstorage 模式下拼 —— cookie 模式拼了也没用（浏览器已经带 cookie 了）。
8. **`ws.data.auth` 是 null** → 路由不在 `/api/*` 下（`authInterceptor` 只管 `/api/*`），这种路径等于完全公开。
9. **`Cannot find module '@shared/...'`** → `@shared` 别名要配**三处**：`web/vite.config.ts` 的 `resolve.alias`、`web/tsconfig.app.json` 的 `paths`（给 `tsc`）、`web/tsconfig.json` 的 `paths`（给 Bun 这类按 tsconfig 解析的运行时）；只配一两处的症状正是"typecheck 过了、跑起来找不到模块"。
10. **改了 `shared/` 只有一边生效** → 共享层是源码直连，没有构建产物，但**两个 program 都要过**：`cd server && bun run typecheck` + `cd web && bun run typecheck && bun run lint`，前端再 `bunx vite build` 一次确认能打进 bundle。

## 什么时候别用 WS

- 一次性请求 / 响应、要缓存、要重试编排 → 用 HTTP（`api/<feature>/<feature>.ts` 里的 `get` / `post`）
- 传文件、传二进制 → 协议只走 JSON 文本帧，走 HTTP 上传
- 需要"必达、不重、有序"的领域事件 → 落库 + 拉取 + 去重，WS 只当"有新东西了"的提示
