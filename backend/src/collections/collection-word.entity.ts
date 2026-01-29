import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Collection } from '../collections/collection.entity';
import { Word } from '../words/word.entity';

@Entity('collection_words')
export class CollectionWord {
  @PrimaryColumn({ type: 'uuid' })
  collection_id!: string;

  @PrimaryColumn({ type: 'uuid' })
  word_id!: string;

  @Column({ type: 'integer' })
  position!: number;

  @ManyToOne(() => Collection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'collection_id' })
  collection!: Collection;

  @ManyToOne(() => Word, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'word_id' })
  word!: Word;
}
