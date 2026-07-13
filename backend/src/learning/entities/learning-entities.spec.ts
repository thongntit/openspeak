import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { User } from '../../users/user.entity';
import { Deck } from './deck.entity';
import { Card } from './card.entity';
import { UserDeck } from './user-deck.entity';
import { UserCardProgress } from './user-card-progress.entity';
import { ReviewEvent } from './review-event.entity';

const entities = [User, Deck, Card, UserDeck, UserCardProgress, ReviewEvent];

function tableName(target: object) {
  return getMetadataArgsStorage().tables.find(
    (table) => table.target === target,
  )?.name;
}

function columnNames(target: object) {
  return getMetadataArgsStorage()
    .columns.filter((column) => column.target === target)
    .map((column) => column.propertyName);
}

function indexNames(target: object) {
  return getMetadataArgsStorage()
    .indices.filter((index) => index.target === target)
    .map((index) => index.name);
}

describe('production learning entity metadata', () => {
  it('registers the six production tables', () => {
    expect(entities.map(tableName)).toEqual([
      'users',
      'decks',
      'cards',
      'user_decks',
      'user_card_progress',
      'review_events',
    ]);
  });

  it('defines stable uniqueness contracts', () => {
    expect(indexNames(User)).toContain('uq_users_clerk_user_id');
    expect(indexNames(Deck)).toContain('uq_decks_slug');
    expect(indexNames(Card)).toContain('uq_cards_deck_content_key');
    expect(indexNames(UserDeck)).toContain('uq_user_decks_user_deck');
    expect(indexNames(UserCardProgress)).toContain(
      'uq_user_card_progress_user_card',
    );
    expect(indexNames(ReviewEvent)).toContain('uq_review_events_user_request');
  });

  it('indexes the user due queue', () => {
    expect(indexNames(UserCardProgress)).toContain(
      'idx_user_card_progress_user_due',
    );
  });

  it('stores versioned scheduling state on progress', () => {
    expect(columnNames(UserCardProgress)).toEqual(
      expect.arrayContaining([
        'stage',
        'due_at',
        'stability',
        'difficulty',
        'elapsed_days',
        'scheduled_days',
        'repetitions',
        'lapses',
        'last_reviewed_at',
        'last_rating',
        'scheduler_version',
      ]),
    );
  });

  it('stores immutable review audit and idempotency fields', () => {
    expect(columnNames(ReviewEvent)).toEqual(
      expect.arrayContaining([
        'client_request_id',
        'rating',
        'reviewed_at',
        'client_reviewed_at',
        'scheduler_version',
        'state_before',
        'state_after',
      ]),
    );
  });
});
