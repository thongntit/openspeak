import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../users/users.service';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { ClerkTokenVerifier } from './clerk-token-verifier.service';

function contextWithAuthorization(authorization?: string) {
  const request: {
    headers: { authorization?: string };
    user?: { id: string; clerkUserId: string };
  } = { headers: { authorization } };
  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('ClerkAuthGuard', () => {
  const getAllAndOverride = jest.fn().mockReturnValue(false);
  const verify = jest.fn().mockResolvedValue({ clerkUserId: 'user_123' });
  const resolveByClerkUserId = jest.fn().mockResolvedValue({
    id: '2f35e726-198d-4862-84df-f1c12dbe9347',
    clerk_user_id: 'user_123',
  });
  const reflector = {
    getAllAndOverride,
  } as unknown as Reflector;
  const verifier = {
    verify,
  } as unknown as ClerkTokenVerifier;
  const users = {
    resolveByClerkUserId,
  } as unknown as UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    getAllAndOverride.mockReturnValue(false);
    verify.mockResolvedValue({ clerkUserId: 'user_123' });
  });

  it('bypasses authentication only for explicitly public routes', async () => {
    getAllAndOverride.mockReturnValue(true);
    const guard = new ClerkAuthGuard(reflector, verifier, users);
    const { context } = contextWithAuthorization();

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verify).not.toHaveBeenCalled();
  });

  it('rejects a request without a bearer token', async () => {
    const guard = new ClerkAuthGuard(reflector, verifier, users);
    const { context } = contextWithAuthorization();

    await expect(guard.canActivate(context)).rejects.toEqual(
      new UnauthorizedException('Authentication required'),
    );
  });

  it('maps token verification errors to a stable unauthorized response', async () => {
    verify.mockRejectedValue(new Error('Clerk detail'));
    const guard = new ClerkAuthGuard(reflector, verifier, users);
    const { context } = contextWithAuthorization('Bearer bad-token');

    await expect(guard.canActivate(context)).rejects.toEqual(
      new UnauthorizedException('Authentication required'),
    );
  });

  it('provisions the user and attaches an application principal', async () => {
    const guard = new ClerkAuthGuard(reflector, verifier, users);
    const { context, request } = contextWithAuthorization('Bearer good-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verify).toHaveBeenCalledWith('good-token');
    expect(resolveByClerkUserId).toHaveBeenCalledWith('user_123');
    expect(request.user).toEqual({
      id: '2f35e726-198d-4862-84df-f1c12dbe9347',
      clerkUserId: 'user_123',
    });
  });
});
