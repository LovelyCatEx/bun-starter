/**
 * 协议保留的事件名：心跳与业务事件同在帧这一层，两端必须用同一个字面量（见 websocket skill）。
 */

/** 客户端 → 服务端：我还在，你还在吗 */
export const WS_PING = 'ping';

/** 服务端 → 客户端：我还在 */
export const WS_PONG = 'pong';
