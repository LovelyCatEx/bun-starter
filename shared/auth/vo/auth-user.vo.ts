/**
 * 对外暴露的用户形状，两端共用（前端 `getMe()` / `login()` 拿到的就是它）。
 *
 * 注意它**不是**服务端的 `AuthUser`：那个是 provider 的内部模型（还会带 `passwordHash`
 * 之类不该出门的东西），这里是"能出现在响应里的那几个字段"。两者的映射写在调用点。
 */
export class AuthUserVo {
  id: string;
  username: string;
  name: string;

  constructor(id: string, username: string, name: string) {
    this.id = id;
    this.username = username;
    this.name = name;
  }
}
