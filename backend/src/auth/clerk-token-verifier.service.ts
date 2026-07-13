import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';

@Injectable()
export class ClerkTokenVerifier {
  constructor(private readonly config: ConfigService) {}

  async verify(token: string): Promise<{ clerkUserId: string }> {
    const secretKey = this.config.getOrThrow<string>('CLERK_SECRET_KEY');
    const payload = await verifyToken(token, { secretKey });
    if (!payload.sub) throw new Error('Token subject is missing');
    return { clerkUserId: payload.sub };
  }
}
