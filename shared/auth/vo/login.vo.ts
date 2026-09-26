import { AuthUserVo } from './auth-user.vo';

/** 登录成功的响应形状：token 加上它属于谁。 */
export class LoginVo {
  token: string;
  user: AuthUserVo;

  constructor(token: string, user: AuthUserVo) {
    this.token = token;
    this.user = user;
  }
}
