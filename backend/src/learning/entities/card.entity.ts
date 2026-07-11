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
import { Deck, DeckType } from './deck.entity';

@Entity('cards')
@Index('uq_cards_deck_content_key', ['deck_id', 'content_key'], {
  unique: true,
})
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  deck_id!: string;

  @Column({ type: 'varchar', length: 120 })
  content_key!: string;

  @Column({ type: 'varchar', length: 20 })
  type!: DeckType;

  @Column({ type: 'varchar', length: 20 })
  level!: string;

  @Column({ type: 'text' })
  front!: string;

  @Column({ type: 'text' })
  answer!: string;

  @Column({ type: 'text' })
  explanation!: string;

  @Column({ type: 'text', nullable: true })
  example!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  options!: string[] | null;

  @Column({ type: 'integer', default: 0 })
  sort_order!: number;

  @Column({ type: 'varchar', length: 40 })
  content_version!: string;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @ManyToOne(() => Deck, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'deck_id' })
  deck!: Deck;
}
