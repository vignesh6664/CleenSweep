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

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      // Decode the token to get the header (without verification)
      const decodedToken = jwt.decode(token, { complete: true });
      if (!decodedToken || typeof decodedToken === 'string') {
        throw new UnauthorizedException('Invalid token format');
      }

      // Get the signing key from Kinde's JWKS
      const key = await this.getSigningKey(decodedToken.header.kid);

      // Verify the token
      const payload = jwt.verify(token, key, {
        algorithms: ['RS256'],
        issuer: this.configService.get<string>('KINDE_DOMAIN'),
      }) as jwt.JwtPayload;

      // Extract user information from token
      const userId = payload.sub;
      const email = payload.email;
      const name = payload.given_name || payload.name;

      if (!userId || !email) {
        throw new UnauthorizedException('Invalid token claims');
      }

      // Find or create user in database
      const user = await this.authService.findOrCreateUser(
        userId,
        email,
        name,
      );

      // Attach user to request object
      request.user = {
        id: user.id,
        email: user.email,
        name: user.name,
      };

      return true;
    } catch (error) {
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
        if (err) {
          reject(new UnauthorizedException('Failed to get signing key'));
        } else {
          const signingKey =
            'publicKey' in key ? key.publicKey : key.rsaPublicKey;
          resolve(signingKey);
        }
      });
    });
  }
}
