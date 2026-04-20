import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1738157000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create words table
    await queryRunner.query(`
      CREATE TABLE words (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        word VARCHAR(100) NOT NULL UNIQUE,
        ipa VARCHAR(200) NOT NULL,
        phonemes JSONB NOT NULL,
        difficulty VARCHAR(20),
        syllables INTEGER,
        audio_url VARCHAR(500),
        example_sentence TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create GIN index on phonemes for efficient contains queries
    await queryRunner.query(`
      CREATE INDEX idx_phonemes_gin ON words USING GIN (phonemes)
    `);

    // Create indexes for common queries
    await queryRunner.query(`
      CREATE INDEX idx_word_difficulty ON words(difficulty)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_word_text ON words(word)
    `);

    // Create collections table
    await queryRunner.query(`
      CREATE TABLE collections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        description TEXT,
        difficulty VARCHAR(20),
        tags JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes for collections
    await queryRunner.query(`
      CREATE INDEX idx_collections_difficulty ON collections(difficulty)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_collections_tags ON collections USING GIN (tags)
    `);

    // Create collection_words junction table
    await queryRunner.query(`
      CREATE TABLE collection_words (
        collection_id UUID NOT NULL,
        word_id UUID NOT NULL,
        position INTEGER NOT NULL,
        PRIMARY KEY (collection_id, word_id),
        FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
        FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for collection_words
    await queryRunner.query(`
      CREATE INDEX idx_collection_words_collection ON collection_words(collection_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_collection_words_word ON collection_words(word_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_collection_words_position ON collection_words(collection_id, position)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE collection_words`);
    await queryRunner.query(`DROP TABLE collections`);
    await queryRunner.query(`DROP TABLE words`);
  }
}
