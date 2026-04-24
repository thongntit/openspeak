import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  clerkUserId: string;
}

@Injectable()
export class ClerkMiddleware implements NestMiddleware {
  private secretKey: string;

  constructor(private readonly config: ConfigService) {
    this.secretKey = this.config.getOrThrow<string>('CLERK_SECRET_KEY');
  }

  async use(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }
    const token = authHeader.slice(7);
    try {
      const payload = await verifyToken(token, { secretKey: this.secretKey });
      (req as AuthenticatedRequest).clerkUserId = payload.sub;
      next();
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
