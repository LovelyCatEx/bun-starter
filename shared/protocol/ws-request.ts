/**
 * 一条从客户端进来的 WS 帧，两端共用（服务端 `parse`、前端定型）。
 *
 * WS 是不可信边界，一律从 `parse()` 进来：要么给出字段齐全的请求，要么给出 `null`，
 * 由调用点决定回错误帧还是断连。
 */
export class WsRequest<T = unknown> {
  /**
   * 应答要原样带回来的 id；单向通知时为 `null`。有了它，一个连接上可以同时飞着多个
   * 请求而各自对号入座 —— 没有它就只能假设"同一个 event 只有一帧在途"。
   */
  id: string | null;

  /** 事件名：`<feature>.<action>`，如 `chat.send`。`WS_PING` / `WS_PONG` 是保留的。 */
  event: string;

  /** 业务负载，形状由事件决定（见 `parse` 的泛型说明）。 */
  data: T;

  constructor(event: string, data?: T, id: string | null = null) {
    this.event = event;
    this.data = data as T;
    this.id = id;
  }

  /**
   * 原始帧 → `WsRequest`，认不出来就 `null`。泛型是**调用点的承诺而不是校验**：只保证
   * 外层三个字段存在且类型正确，`data` 内部仍是 `unknown`，需要严格校验就自己再收一道。
   */
  static parse<T = unknown>(frame: unknown): WsRequest<T> | null {
    const payload = WsRequest.decode(frame);

    if (payload === null) {
      return null;
    }

    const { id, event, data } = payload;

    if (typeof event !== 'string' || event === '') {
      return null;
    }

    if (id !== undefined && id !== null && typeof id !== 'string') {
      return null;
    }

    return new WsRequest<T>(event, data as T, typeof id === 'string' ? id : null);
  }

  /**
   * 原始帧 → 普通对象。文本按 JSON 解，二进制按 UTF-8 解完再 JSON 解；
   * 其余（空帧、数字、数组、坏 JSON）一律 `null`。
   */
  private static decode(frame: unknown): Record<string, unknown> | null {
    let value: unknown = frame;

    if (typeof value === 'string') {
      value = WsRequest.asJson(value);
    } else if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
      value = WsRequest.asJson(new TextDecoder().decode(value));
    }

    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private static asJson(text: string): unknown {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      // 坏 JSON 是客户端的问题，不是服务端该抛异常的地方：交给调用点回错误帧或断连。
      return null;
    }
  }
}
