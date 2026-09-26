/**
 * 登录请求的负载。
 *
 * 共享层的 dto / vo 都是**纯形状 + 纯参数构造**：构造函数只吃自己的字段，不认识
 * provider、entity、数据库行这些服务端内部模型 —— 认识了就没法共享了。内部模型到 vo
 * 的适配写在服务端调用点（controller），一行一个字段。
 */
export class LoginDto {
  username: string;
  password: string;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }
}
