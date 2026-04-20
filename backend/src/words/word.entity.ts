import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('words')
export class Word {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  word!: string;

  @Column({ type: 'varchar', length: 200 })
  ipa!: string;

  @Column({ type: 'jsonb' })
  phonemes!: string[];

  @Column({ type: 'varchar', length: 20, nullable: true })
  difficulty!: string | null;

  @Column({ type: 'integer', nullable: true })
  syllables!: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  audio_url!: string | null;

  @Column({ type: 'text', nullable: true })
  example_sentence!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;
}
