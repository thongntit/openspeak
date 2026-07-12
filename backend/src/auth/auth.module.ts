import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from '../users/users.module';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { ClerkTokenVerifier } from './clerk-token-verifier.service';

@Module({
  imports: [UsersModule],
  providers: [
    ClerkTokenVerifier,
    ClerkAuthGuard,
    { provide: APP_GUARD, useExisting: ClerkAuthGuard },
  ],
  exports: [ClerkAuthGuard, ClerkTokenVerifier],
})
export class AuthModule {}
