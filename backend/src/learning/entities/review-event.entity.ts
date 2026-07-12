import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Card } from './card.entity';
import { ReviewRating } from './user-card-progress.entity';

@Entity('review_events')
@Index('uq_review_events_user_request', ['user_id', 'client_request_id'], {
  unique: true,
})
export class ReviewEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'uuid' })
  card_id!: string;

  @Column({ type: 'uuid' })
  client_request_id!: string;

  @Column({ type: 'varchar', length: 20 })
  rating!: ReviewRating;

  @Column({ type: 'timestamptz' })
  reviewed_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  client_reviewed_at!: Date | null;

  @Column({ type: 'varchar', length: 40 })
  scheduler_version!: string;

  @Column({ type: 'jsonb' })
  state_before!: Record<string, unknown>;

  @Column({ type: 'jsonb' })
  state_after!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Card, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'card_id' })
  card!: Card;
}
