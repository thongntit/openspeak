import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Pick<Repository<User>, 'upsert' | 'findOneByOrFail'>;

  beforeEach(async () => {
    repository = {
      upsert: jest.fn().mockResolvedValue(undefined),
      findOneByOrFail: jest.fn().mockResolvedValue({
        id: '2f35e726-198d-4862-84df-f1c12dbe9347',
        clerk_user_id: 'user_123',
      }),
    };
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repository },
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
});
