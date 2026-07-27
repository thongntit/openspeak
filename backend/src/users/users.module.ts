import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewEvent } from '../learning/entities/review-event.entity';
import { UserCardProgress } from '../learning/entities/user-card-progress.entity';
import { UserDeck } from '../learning/entities/user-deck.entity';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ReviewEvent, UserDeck, UserCardProgress]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
