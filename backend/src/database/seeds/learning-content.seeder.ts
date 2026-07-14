import { DataSource, In } from 'typeorm';
import { LearningContentBundle } from '../content/learning-content.types';
import { Card } from '../../learning/entities/card.entity';
import { Deck, DeckType } from '../../learning/entities/deck.entity';

const MANAGED_CONTENT_VERSION = 'starter@%';

export interface LearningContentSeedSummary {
  contentVersion: string;
  decksUpserted: number;
  cardsUpserted: number;
  decksUnpublished: number;
  cardsDeactivated: number;
}

export async function seedLearningContent(
  dataSource: DataSource,
  bundle: LearningContentBundle,
): Promise<LearningContentSeedSummary> {
  return dataSource.transaction(async (manager) => {
    const deckRepository = manager.getRepository(Deck);
    const cardRepository = manager.getRepository(Card);
    const sourceSlugs = bundle.decks.map((deck) => deck.slug);

    if (bundle.decks.length > 0) {
      await deckRepository.upsert(
        bundle.decks.map((deck) => ({
          slug: deck.slug,
          name: deck.name,
          description: deck.description,
          type: deck.type as DeckType,
          level: deck.level,
          content_version: bundle.databaseContentVersion,
          sort_order: deck.sortOrder,
          is_published: deck.isPublished,
        })),
        ['slug'],
      );
    }

    const persistedDecks =
      sourceSlugs.length > 0
        ? await deckRepository.findBy({ slug: In(sourceSlugs) })
        : [];
    const deckIdsBySlug = new Map(
      persistedDecks.map((deck) => [deck.slug, deck.id]),
    );
    const cards = bundle.decks.flatMap((deck) => {
      const deckId = deckIdsBySlug.get(deck.slug);
      if (!deckId) {
        throw new Error(`Deck "${deck.slug}" was not found after upsert`);
      }

      return deck.cards.map((card) => ({
        deck_id: deckId,
        content_key: card.contentKey,
        type: card.type as DeckType,
        level: card.level,
        front: card.front,
        answer: card.answer,
        explanation: card.explanation,
        example: card.example,
        options: card.options ?? null,
        sort_order: card.sortOrder,
        content_version: bundle.databaseContentVersion,
        is_active: true,
      }));
    });

    if (cards.length > 0) {
      await cardRepository.upsert(cards, ['deck_id', 'content_key']);
    }

    let cardsDeactivated = 0;
    for (const sourceDeck of bundle.decks) {
      const deckId = deckIdsBySlug.get(sourceDeck.slug);
      if (!deckId) {
        throw new Error(`Deck "${sourceDeck.slug}" was not found after upsert`);
      }

      const cardRetirement = cardRepository
        .createQueryBuilder()
        .update(Card)
        .set({ is_active: false })
        .where('deck_id = :deckId', { deckId })
        .andWhere('content_version LIKE :managedVersion', {
          managedVersion: MANAGED_CONTENT_VERSION,
        })
        .andWhere('is_active = :isActive', { isActive: true });
      const sourceContentKeys = sourceDeck.cards.map((card) => card.contentKey);
      if (sourceContentKeys.length > 0) {
        cardRetirement.andWhere('content_key NOT IN (:...sourceContentKeys)', {
          sourceContentKeys,
        });
      }

      const result = await cardRetirement.execute();
      cardsDeactivated += result.affected ?? 0;
    }

    const managedDecksMissingFromSource = deckRepository
      .createQueryBuilder('managedDeck')
      .select('managedDeck.id')
      .where('managedDeck.content_version LIKE :managedVersion', {
        managedVersion: MANAGED_CONTENT_VERSION,
      });
    if (sourceSlugs.length > 0) {
      managedDecksMissingFromSource.andWhere(
        'managedDeck.slug NOT IN (:...sourceSlugs)',
        { sourceSlugs },
      );
    }

    const retiredDeckCardsResult = await cardRepository
      .createQueryBuilder()
      .update(Card)
      .set({ is_active: false })
      .where(`deck_id IN (${managedDecksMissingFromSource.getQuery()})`)
      .andWhere('content_version LIKE :managedVersion', {
        managedVersion: MANAGED_CONTENT_VERSION,
      })
      .andWhere('is_active = :isActive', { isActive: true })
      .setParameters(managedDecksMissingFromSource.getParameters())
      .execute();
    cardsDeactivated += retiredDeckCardsResult.affected ?? 0;

    const deckRetirement = deckRepository
      .createQueryBuilder()
      .update(Deck)
      .set({ is_published: false })
      .where('content_version LIKE :managedVersion', {
        managedVersion: MANAGED_CONTENT_VERSION,
      })
      .andWhere('is_published = :isPublished', { isPublished: true });
    if (sourceSlugs.length > 0) {
      deckRetirement.andWhere('slug NOT IN (:...sourceSlugs)', {
        sourceSlugs,
      });
    }
    const retiredDecksResult = await deckRetirement.execute();

    return {
      contentVersion: bundle.databaseContentVersion,
      decksUpserted: bundle.decks.length,
      cardsUpserted: cards.length,
      decksUnpublished: retiredDecksResult.affected ?? 0,
      cardsDeactivated,
    };
  });
}
