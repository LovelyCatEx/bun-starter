/** 能出现在响应里的用户字段；不是服务端的 `AuthUser` 内部模型，映射写在调用点。 */
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
