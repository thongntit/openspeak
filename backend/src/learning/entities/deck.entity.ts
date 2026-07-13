import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DeckType {
  Vocabulary = 'vocab',
  Grammar = 'grammar',
  Tip = 'tip',
}

@Entity('decks')
@Index('uq_decks_slug', ['slug'], { unique: true })
export class Deck {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  slug!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 20 })
  type!: DeckType;

  @Column({ type: 'varchar', length: 20 })
  level!: string;

  @Column({ type: 'varchar', length: 40 })
  content_version!: string;

  @Column({ type: 'integer', default: 0 })
  sort_order!: number;

  @Column({ type: 'boolean', default: false })
  is_published!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
