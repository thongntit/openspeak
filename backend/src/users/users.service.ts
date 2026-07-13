import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async resolveByClerkUserId(clerkUserId: string): Promise<User> {
    await this.users.upsert(
      { clerk_user_id: clerkUserId },
      {
        conflictPaths: ['clerk_user_id'],
        skipUpdateIfNoValuesChanged: true,
      },
    );
    return this.users.findOneByOrFail({ clerk_user_id: clerkUserId });
  }
}
