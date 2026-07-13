import { QueryRunner } from 'typeorm';
import { ProductionLearningFoundation1783746000000 } from '../migrations/1783746000000-ProductionLearningFoundation';

function queryRunnerStub() {
  return {
    query: jest.fn().mockResolvedValue(undefined),
  } as unknown as QueryRunner;
}

describe('ProductionLearningFoundation migration', () => {
  it('creates the complete learning schema and query indexes', async () => {
    const queryRunner = queryRunnerStub();
    const migration = new ProductionLearningFoundation1783746000000();

    await migration.up(queryRunner);

    const sql = (queryRunner.query as jest.Mock).mock.calls
      .map(([statement]) => statement as string)
      .join('\n');

    for (const table of [
      'users',
      'decks',
      'cards',
      'user_decks',
      'user_card_progress',
      'review_events',
    ]) {
      expect(sql).toContain(`CREATE TABLE ${table}`);
    }
    expect(sql).toContain('uq_users_clerk_user_id');
    expect(sql).toContain('uq_cards_deck_content_key');
    expect(sql).toContain('uq_user_decks_user_deck');
    expect(sql).toContain('uq_user_card_progress_user_card');
    expect(sql).toContain('uq_review_events_user_request');
    expect(sql).toContain('idx_user_card_progress_user_due');
    expect(sql).toContain('ON DELETE CASCADE');
    expect(sql).toContain('ON DELETE RESTRICT');
    expect(sql).toContain(
      "CHECK (stage IN ('new', 'learning', 'review', 'mastered'))",
    );
    expect(sql).toContain(
      "CHECK (rating IN ('again', 'hard', 'good', 'easy'))",
    );
  });

  it('drops learning tables in reverse dependency order', async () => {
    const queryRunner = queryRunnerStub();
    const migration = new ProductionLearningFoundation1783746000000();

    await migration.down(queryRunner);

    expect(
      (queryRunner.query as jest.Mock).mock.calls.map(([sql]) => sql),
    ).toEqual([
      'DROP TABLE review_events',
      'DROP TABLE user_card_progress',
      'DROP TABLE user_decks',
      'DROP TABLE cards',
      'DROP TABLE decks',
      'DROP TABLE users',
    ]);
  });
});
