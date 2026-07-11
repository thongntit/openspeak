import { Controller, Get, INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { AuthenticatedPrincipal } from '../src/auth/authenticated-principal';
import { ClerkAuthGuard } from '../src/auth/clerk-auth.guard';
import { ClerkTokenVerifier } from '../src/auth/clerk-token-verifier.service';
import { Public } from '../src/auth/public.decorator';
import { CurrentUser } from '../src/users/current-user.decorator';
import { UsersService } from '../src/users/users.service';

@Controller()
class AuthTestController {
  @Get('public')
  @Public()
  publicRoute() {
    return { public: true };
  }

  @Get('protected')
  protectedRoute(@CurrentUser() principal: AuthenticatedPrincipal) {
    return principal;
  }
}

describe('mandatory authentication (e2e)', () => {
  let app: INestApplication;
  const verifier = {
    verify: jest.fn().mockResolvedValue({ clerkUserId: 'user_123' }),
  };
  const users = {
    resolveByClerkUserId: jest.fn().mockResolvedValue({
      id: '2f35e726-198d-4862-84df-f1c12dbe9347',
      clerk_user_id: 'user_123',
    }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthTestController],
      providers: [
        ClerkAuthGuard,
        { provide: ClerkTokenVerifier, useValue: verifier },
        { provide: UsersService, useValue: users },
        { provide: APP_GUARD, useExisting: ClerkAuthGuard },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    verifier.verify.mockResolvedValue({ clerkUserId: 'user_123' });
  });

  afterAll(async () => app.close());

  it('allows explicitly public endpoints without a token', async () => {
    await request(app.getHttpServer())
      .get('/api/public')
      .expect(200)
      .expect({ public: true });
  });

  it('returns 401 for a protected endpoint without a token', async () => {
    const response = await request(app.getHttpServer()).get('/api/protected');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required');
  });

  it('returns 401 without exposing verifier errors', async () => {
    verifier.verify.mockRejectedValue(new Error('private Clerk detail'));

    const response = await request(app.getHttpServer())
      .get('/api/protected')
      .set('Authorization', 'Bearer invalid');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required');
    expect(JSON.stringify(response.body)).not.toContain('private Clerk detail');
  });

  it('returns the provisioned principal for a valid token', async () => {
    await request(app.getHttpServer())
      .get('/api/protected')
      .set('Authorization', 'Bearer valid')
      .expect(200)
      .expect({
        id: '2f35e726-198d-4862-84df-f1c12dbe9347',
        clerkUserId: 'user_123',
      });
  });
});
