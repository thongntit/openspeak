import { UsersController } from './users.controller';

describe('UsersController', () => {
  it('returns only the authenticated application principal', () => {
    const controller = new UsersController();

    expect(
      controller.bootstrap({
        id: '2f35e726-198d-4862-84df-f1c12dbe9347',
        clerkUserId: 'user_123',
      }),
    ).toEqual({
      id: '2f35e726-198d-4862-84df-f1c12dbe9347',
      clerkUserId: 'user_123',
    });
  });
});
