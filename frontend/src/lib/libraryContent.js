export const CONTENT_DECK_PAGE_LIMIT = 100;

export function filterLibraryDecks(decks, filter) {
  return filter === 'all'
    ? decks
    : decks.filter((deck) => deck.type === filter);
}

export async function loadAllContentDecks(fetchPage) {
  const decks = [];
  let offset = 0;
  let hasNext = true;

  while (hasNext) {
    const page = await fetchPage({
      limit: CONTENT_DECK_PAGE_LIMIT,
      offset,
    });
    decks.push(...page.data);
    hasNext = page.hasNext;
    offset += page.limit;

    if (hasNext && page.data.length === 0) {
      throw new Error('Content deck pagination did not advance');
    }
  }

  return decks;
}
