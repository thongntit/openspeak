import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { ReviewEvent } from '../learning/entities/review-event.entity';
import { UserCardProgress } from '../learning/entities/user-card-progress.entity';
import { UserDeck } from '../learning/entities/user-deck.entity';
import { LEARNING_VISIBILITY_CONDITION } from '../learning/learning-visibility';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Pick<Repository<User>, 'upsert' | 'findOneByOrFail'>;
  let reviewEvents: { countBy: jest.Mock };
  let userDecks: { countBy: jest.Mock };
  let dueQuery: {
    innerJoin: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    getCount: jest.Mock;
  };
  let progress: { createQueryBuilder: jest.Mock };
  const userId = '2f35e726-198d-4862-84df-f1c12dbe9347';
  const now = new Date('2026-07-27T00:00:00.000Z');

  beforeEach(async () => {
    repository = {
      upsert: jest.fn().mockResolvedValue(undefined),
      findOneByOrFail: jest.fn().mockResolvedValue({
        id: '2f35e726-198d-4862-84df-f1c12dbe9347',
        clerk_user_id: 'user_123',
      }),
    };
    reviewEvents = { countBy: jest.fn().mockResolvedValue(17) };
    userDecks = { countBy: jest.fn().mockResolvedValue(2) };
    dueQuery = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(4),
    };
    progress = {
      createQueryBuilder: jest.fn().mockReturnValue(dueQuery),
    };
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repository },
        { provide: getRepositoryToken(ReviewEvent), useValue: reviewEvents },
        { provide: getRepositoryToken(UserDeck), useValue: userDecks },
        { provide: getRepositoryToken(UserCardProgress), useValue: progress },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  it('upserts by Clerk user id before reading the canonical user', async () => {
    const user = await service.resolveByClerkUserId('user_123');

    expect(repository.upsert).toHaveBeenCalledWith(
      { clerk_user_id: 'user_123' },
      {
        conflictPaths: ['clerk_user_id'],
        skipUpdateIfNoValuesChanged: true,
      },
    );
    expect(repository.findOneByOrFail).toHaveBeenCalledWith({
      clerk_user_id: 'user_123',
    });
    expect(user).toMatchObject({
      id: '2f35e726-198d-4862-84df-f1c12dbe9347',
      clerk_user_id: 'user_123',
    });
  });

  it('propagates a failed canonical read', async () => {
    (repository.findOneByOrFail as jest.Mock).mockRejectedValue(
      new Error('User missing after upsert'),
    );

    await expect(service.resolveByClerkUserId('user_123')).rejects.toThrow(
      'User missing after upsert',
    );
  });

  it('returns only persisted learning counts for the current user', async () => {
    await expect(service.getProfileSummary(userId, now)).resolves.toEqual({
      reviewsCompleted: 17,
      learningDecks: 2,
      dueNow: 4,
    });

    expect(reviewEvents.countBy).toHaveBeenCalledWith({ user_id: userId });
    expect(userDecks.countBy).toHaveBeenCalledWith({
      user_id: userId,
      is_active: true,
    });
    expect(progress.createQueryBuilder).toHaveBeenCalledWith('progress');
    expect(dueQuery.innerJoin).toHaveBeenNthCalledWith(
      1,
      'progress.card',
      'card',
    );
    expect(dueQuery.innerJoin).toHaveBeenNthCalledWith(2, 'card.deck', 'deck');
    expect(dueQuery.innerJoin).toHaveBeenNthCalledWith(
      3,
      'user_decks',
      'enrollment',
      'enrollment.user_id = progress.user_id AND enrollment.deck_id = card.deck_id',
    );
    expect(dueQuery.where).toHaveBeenCalledWith('progress.user_id = :userId', {
      userId,
    });
    expect(dueQuery.andWhere).toHaveBeenCalledWith('progress.due_at <= :now', {
      now,
    });
    expect(dueQuery.andWhere).toHaveBeenCalledWith(
      LEARNING_VISIBILITY_CONDITION,
    );
  });
});
