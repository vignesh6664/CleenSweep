import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';
import { AuthService } from './auth.service';

@Injectable()
export class KindeAuthGuard implements CanActivate {
  private jwksClient: jwksClient.JwksClient;

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const kindeDomain = this.configService.get<string>('KINDE_DOMAIN');
    if (!kindeDomain) {
      throw new Error('KINDE_DOMAIN environment variable is not set');
    }

    // Initialize JWKS client to fetch Kinde's public keys
    this.jwksClient = jwksClient.default({
      jwksUri: `${kindeDomain}/.well-known/jwks.json`,
      cache: true,
      rateLimit: true,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    // DEMO MODE: Bypass auth completely for demo sessions
    if (token === 'demo-token' || request.headers['x-demo-mode'] === 'true' || !token) {
      request.user = {
        id: 'demo-user',
        email: 'demo@cleansweep.io',
        name: 'Demo FinOps Engineer',
      };
      return true;
    }

    console.log('[KindeAuthGuard] Token received:', token ? 'YES' : 'NO');

    try {
      // Decode the token to get the header (without verification)
      const decodedToken = jwt.decode(token, { complete: true });
      if (!decodedToken || typeof decodedToken === 'string') {
        throw new UnauthorizedException('Invalid token format');
      }

      console.log('[KindeAuthGuard] Token decoded successfully');
      console.log('[KindeAuthGuard] KID:', decodedToken.header.kid);

      // Get the signing key from Kinde's JWKS
      const key = await this.getSigningKey(decodedToken.header.kid);

      console.log('[KindeAuthGuard] Signing key retrieved');

      // Verify the token
      const payload = jwt.verify(token, key, {
        algorithms: ['RS256'],
        issuer: this.configService.get<string>('KINDE_DOMAIN'),
      }) as jwt.JwtPayload;

      console.log('[KindeAuthGuard] Token verified successfully');

      // Extract user information from token
      const userId = payload.sub;
      let email = payload.email;
      let name = payload.given_name || payload.name;

      console.log('[KindeAuthGuard] User info from token:', { userId, email, name });

      if (!userId) {
        throw new UnauthorizedException('Invalid token claims: missing user ID');
      }

      // If email is not in the token, fetch it from Kinde's userinfo endpoint
      if (!email) {
        console.log('[KindeAuthGuard] Email not in token, fetching from userinfo endpoint...');
        try {
          const kindeUrl = this.configService.get<string>('KINDE_DOMAIN');
          const userinfoResponse = await fetch(`${kindeUrl}/oauth2/v2/user_profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (userinfoResponse.ok) {
            const userinfo = await userinfoResponse.json();
            email = userinfo.email;
            name = name || userinfo.given_name || userinfo.name;
            console.log('[KindeAuthGuard] User info from API:', { email, name });
          } else {
            console.error('[KindeAuthGuard] Failed to fetch userinfo:', userinfoResponse.status);
          }
        } catch (error) {
          console.error('[KindeAuthGuard] Error fetching userinfo:', error.message);
        }
      }

      if (!email) {
        throw new UnauthorizedException('Invalid token claims: missing email');
      }

      // Find or create user in database
      console.log('[KindeAuthGuard] Calling findOrCreateUser...');
      const user = await this.authService.findOrCreateUser(
        userId,
        email,
        name,
      );

      console.log('[KindeAuthGuard] User found/created:', user);

      // Attach user to request object
      request.user = {
        id: user.id,
        email: user.email,
        name: user.name,
      };

      return true;
    } catch (error) {
      console.error('[KindeAuthGuard] Error:', error.message);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        `Token validation failed: ${error.message}`,
      );
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }

  private async getSigningKey(kid: string | undefined): Promise<string> {
    if (!kid) {
      throw new UnauthorizedException('Token missing key ID');
    }

    return new Promise((resolve, reject) => {
      this.jwksClient.getSigningKey(kid, (err, key) => {
        if (err || !key) {
          reject(new UnauthorizedException('Failed to get signing key'));
          return;
        }
        const signingKey =
          'publicKey' in key ? key.publicKey : key.rsaPublicKey;
        resolve(signingKey);
      });
    });
  }
}
