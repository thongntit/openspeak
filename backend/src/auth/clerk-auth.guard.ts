import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../users/users.service';
import { AuthenticatedPrincipal } from './authenticated-principal';
import { ClerkTokenVerifier } from './clerk-token-verifier.service';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly verifier: ClerkTokenVerifier,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthenticatedPrincipal;
    }>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication required');
    }
    const token = authorization.slice(7).trim();
    if (!token) throw new UnauthorizedException('Authentication required');

    let clerkUserId: string;
    try {
      ({ clerkUserId } = await this.verifier.verify(token));
    } catch {
      throw new UnauthorizedException('Authentication required');
    }

    const user = await this.users.resolveByClerkUserId(clerkUserId);
    request.user = { id: user.id, clerkUserId };
    return true;
  }
}
