import type { LoginResult } from '../../service/auth.service';
import { AuthUserVo } from './auth-user.vo';

export class LoginVo {
  token: string;
  user: AuthUserVo;

  constructor(data: LoginResult) {
    this.token = data.token;
    this.user = new AuthUserVo(data.user);
  }
}
