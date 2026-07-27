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

  it('returns the authenticated user learning summary', async () => {
    const users = {
      getProfileSummary: jest.fn().mockResolvedValue({
        reviewsCompleted: 17,
        learningDecks: 2,
        dueNow: 4,
      }),
    };
    const controller = new (UsersController as any)(users);
    const principal = {
      id: '2f35e726-198d-4862-84df-f1c12dbe9347',
      clerkUserId: 'user_123',
    };

    await expect(controller.summary(principal)).resolves.toEqual({
      reviewsCompleted: 17,
      learningDecks: 2,
      dueNow: 4,
    });
    expect(users.getProfileSummary).toHaveBeenCalledWith(principal.id);
  });
});
