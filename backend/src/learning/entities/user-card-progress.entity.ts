import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Card } from './card.entity';

export enum LearningStage {
  New = 'new',
  Learning = 'learning',
  Review = 'review',
  Mastered = 'mastered',
}

export enum ReviewRating {
  Again = 'again',
  Hard = 'hard',
  Good = 'good',
  Easy = 'easy',
}

@Entity('user_card_progress')
@Index('uq_user_card_progress_user_card', ['user_id', 'card_id'], {
  unique: true,
})
@Index('idx_user_card_progress_user_due', ['user_id', 'due_at'])
export class UserCardProgress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'uuid' })
  card_id!: string;

  @Column({ type: 'varchar', length: 20, default: LearningStage.New })
  stage!: LearningStage;

  @Column({ type: 'timestamptz' })
  due_at!: Date;

  @Column({ type: 'numeric', precision: 12, scale: 6, default: 0 })
  stability!: number;

  @Column({ type: 'numeric', precision: 12, scale: 6, default: 0 })
  difficulty!: number;

  @Column({ type: 'integer', default: 0 })
  elapsed_days!: number;

  @Column({ type: 'integer', default: 0 })
  scheduled_days!: number;

  @Column({ type: 'integer', default: 0 })
  repetitions!: number;

  @Column({ type: 'integer', default: 0 })
  lapses!: number;

  @Column({ type: 'timestamptz', nullable: true })
  last_reviewed_at!: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  last_rating!: ReviewRating | null;

  @Column({ type: 'varchar', length: 40 })
  scheduler_version!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Card, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'card_id' })
  card!: Card;
}
