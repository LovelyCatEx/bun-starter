import type { AuthUser } from '../../provider/auth-provider';

export class AuthUserVo {
  id: string;
  username: string;
  name: string;

  constructor(user: AuthUser) {
    this.id = user.id;
    this.username = user.username;
    this.name = user.name;
  }
}
