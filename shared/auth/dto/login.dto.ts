/** 见 shared.md「共享层」：纯形状 + 纯参数构造，内部模型到 vo 的适配在服务端调用点。 */
export class LoginDto {
  username: string;
  password: string;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }
}
