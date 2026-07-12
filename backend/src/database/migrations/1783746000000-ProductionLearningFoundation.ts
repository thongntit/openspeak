import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductionLearningFoundation1783746000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clerk_user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_users_clerk_user_id UNIQUE (clerk_user_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE decks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug VARCHAR(120) NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        type VARCHAR(20) NOT NULL,
        level VARCHAR(20) NOT NULL,
        content_version VARCHAR(40) NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_published BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_decks_slug UNIQUE (slug),
        CONSTRAINT chk_decks_type CHECK (type IN ('vocab', 'grammar', 'tip'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE cards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        deck_id UUID NOT NULL,
        content_key VARCHAR(120) NOT NULL,
        type VARCHAR(20) NOT NULL,
        level VARCHAR(20) NOT NULL,
        front TEXT NOT NULL,
        answer TEXT NOT NULL,
        explanation TEXT NOT NULL,
        example TEXT,
        options JSONB,
        sort_order INTEGER NOT NULL DEFAULT 0,
        content_version VARCHAR(40) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_cards_deck_content_key UNIQUE (deck_id, content_key),
        CONSTRAINT chk_cards_type CHECK (type IN ('vocab', 'grammar', 'tip')),
        CONSTRAINT fk_cards_deck FOREIGN KEY (deck_id)
          REFERENCES decks(id) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE user_decks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        deck_id UUID NOT NULL,
        enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        CONSTRAINT uq_user_decks_user_deck UNIQUE (user_id, deck_id),
        CONSTRAINT fk_user_decks_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_user_decks_deck FOREIGN KEY (deck_id)
          REFERENCES decks(id) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE user_card_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        card_id UUID NOT NULL,
        stage VARCHAR(20) NOT NULL DEFAULT 'new',
        due_at TIMESTAMPTZ NOT NULL,
        stability NUMERIC(12, 6) NOT NULL DEFAULT 0,
        difficulty NUMERIC(12, 6) NOT NULL DEFAULT 0,
        elapsed_days INTEGER NOT NULL DEFAULT 0,
        scheduled_days INTEGER NOT NULL DEFAULT 0,
        repetitions INTEGER NOT NULL DEFAULT 0,
        lapses INTEGER NOT NULL DEFAULT 0,
        last_reviewed_at TIMESTAMPTZ,
        last_rating VARCHAR(20),
        scheduler_version VARCHAR(40) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_user_card_progress_user_card UNIQUE (user_id, card_id),
        CONSTRAINT chk_user_card_progress_stage
          CHECK (stage IN ('new', 'learning', 'review', 'mastered')),
        CONSTRAINT chk_user_card_progress_last_rating
          CHECK (last_rating IS NULL OR last_rating IN ('again', 'hard', 'good', 'easy')),
        CONSTRAINT fk_user_card_progress_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_user_card_progress_card FOREIGN KEY (card_id)
          REFERENCES cards(id) ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_user_card_progress_user_due
      ON user_card_progress(user_id, due_at)
    `);

    await queryRunner.query(`
      CREATE TABLE review_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        card_id UUID NOT NULL,
        client_request_id UUID NOT NULL,
        rating VARCHAR(20) NOT NULL,
        reviewed_at TIMESTAMPTZ NOT NULL,
        client_reviewed_at TIMESTAMPTZ,
        scheduler_version VARCHAR(40) NOT NULL,
        state_before JSONB NOT NULL,
        state_after JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_review_events_user_request UNIQUE (user_id, client_request_id),
        CONSTRAINT chk_review_events_rating
          CHECK (rating IN ('again', 'hard', 'good', 'easy')),
        CONSTRAINT fk_review_events_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE RESTRICT,
        CONSTRAINT fk_review_events_card FOREIGN KEY (card_id)
          REFERENCES cards(id) ON DELETE RESTRICT
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE review_events');
    await queryRunner.query('DROP TABLE user_card_progress');
    await queryRunner.query('DROP TABLE user_decks');
    await queryRunner.query('DROP TABLE cards');
    await queryRunner.query('DROP TABLE decks');
    await queryRunner.query('DROP TABLE users');
  }
}
