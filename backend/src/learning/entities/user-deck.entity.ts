import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Deck } from './deck.entity';

@Entity('user_decks')
@Index('uq_user_decks_user_deck', ['user_id', 'deck_id'], { unique: true })
export class UserDeck {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'uuid' })
  deck_id!: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  enrolled_at!: Date;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Deck, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'deck_id' })
  deck!: Deck;
}
