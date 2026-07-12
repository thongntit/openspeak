import { verifyToken } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';
import { ClerkTokenVerifier } from './clerk-token-verifier.service';

jest.mock('@clerk/backend', () => ({ verifyToken: jest.fn() }));

describe('ClerkTokenVerifier', () => {
  const config = {
    getOrThrow: jest.fn().mockReturnValue('sk_test_secret'),
  } as unknown as ConfigService;

  beforeEach(() => jest.clearAllMocks());

  it('returns the verified Clerk subject', async () => {
    (verifyToken as jest.Mock).mockResolvedValue({ sub: 'user_123' });
    const verifier = new ClerkTokenVerifier(config);

    await expect(verifier.verify('token')).resolves.toEqual({
      clerkUserId: 'user_123',
    });
    expect(verifyToken).toHaveBeenCalledWith('token', {
      secretKey: 'sk_test_secret',
    });
  });

  it('rejects a verified payload without a subject', async () => {
    (verifyToken as jest.Mock).mockResolvedValue({});
    const verifier = new ClerkTokenVerifier(config);

    await expect(verifier.verify('token')).rejects.toThrow(
      'Token subject is missing',
    );
  });
});
