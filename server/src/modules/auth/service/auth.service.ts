import { jwtVerify, SignJWT } from 'jose';

import { config } from '../../../common/config';
import { UnauthorizedException } from '../../../common/exception/http-exceptions';
import { InMemoryAuthProvider } from '../provider/in-memory-auth-provider';
import type {
  AuthCredentials,
  AuthProvider,
  AuthUser,
} from '../provider/auth-provider';

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export class AuthService {
  private readonly provider: AuthProvider;

  constructor(provider: AuthProvider = new InMemoryAuthProvider()) {
    this.provider = provider;
  }

  async login(credentials: AuthCredentials): Promise<LoginResult> {
    const user = await this.provider.authenticate(credentials);

    if (!user) {
      throw new UnauthorizedException('invalid username or password');
    }

    return { token: await this.signToken(user), user };
  }

  /** Stateless check — is this JWT signed by us, still valid, and who is it? */
  async verifyToken(token: string): Promise<AuthUser | null> {
    if (!token) {
      return null;
    }

    try {
      const { payload } = await jwtVerify(
        token,
        this.secret,
        { algorithms: ['HS256'] },
      );

      if (typeof payload.sub !== 'string') {
        return null;
      }

      const { username, name } = payload as {
        username?: unknown;
        name?: unknown;
      };

      if (typeof username !== 'string') {
        return null;
      }

      return {
        id: payload.sub,
        username,
        name: typeof name === 'string' ? name : username,
      };
    } catch {
      return null;
    }
  }

  private get secret(): Uint8Array {
    return new TextEncoder().encode(config.auth.jwtSecret);
  }

  private signToken(user: AuthUser): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    return new SignJWT({ username: user.username, name: user.name })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setIssuedAt(now)
      .setExpirationTime(now + config.auth.tokenTtl)
      .sign(this.secret);
  }
}
