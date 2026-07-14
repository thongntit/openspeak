import { mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  LearningContentManifest,
  LearningDeckSource,
} from './learning-content.types';
import {
  loadLearningContent,
  validateLearningContent,
} from './learning-content.loader';

function createCard(deckNumber: number, cardNumber: number) {
  const answer = `Answer ${deckNumber}-${cardNumber}`;

  return {
    contentKey: `deck-${deckNumber}-card-${cardNumber}`,
    type: ['vocab', 'grammar', 'tip'][(deckNumber - 1) % 3] as
      | 'vocab'
      | 'grammar'
      | 'tip',
    level: 'beginner' as const,
    front: `Prompt ${deckNumber}-${cardNumber}`,
    answer,
    explanation: `Explanation ${deckNumber}-${cardNumber}`,
    example: `Example ${deckNumber}-${cardNumber}`,
    options: [answer, `Distractor ${deckNumber}-${cardNumber}`],
    sortOrder: cardNumber,
  };
}

function createDeck(deckNumber: number): LearningDeckSource {
  const type = ['vocab', 'grammar', 'tip'][(deckNumber - 1) % 3] as
    | 'vocab'
    | 'grammar'
    | 'tip';

  return {
    slug: `deck-${deckNumber}`,
    name: `Deck ${deckNumber}`,
    description: `Description ${deckNumber}`,
    type,
    level: 'beginner',
    sortOrder: deckNumber,
    isPublished: true,
    cards: Array.from({ length: 20 }, (_, index) =>
      createCard(deckNumber, index + 1),
    ),
  };
}

function createValidContent() {
  const decks = Array.from({ length: 6 }, (_, index) => createDeck(index + 1));
  const manifest: LearningContentManifest = {
    schemaVersion: 1,
    namespace: 'starter',
    contentVersion: '2026.07.1',
    deckFiles: decks.map((_, index) => `deck-${index + 1}.json`),
  };

  return { manifest, decks };
}

function cloneValidContent() {
  return structuredClone(createValidContent());
}

const temporaryDirectories: string[] = [];

function writeContentDirectory(
  manifest: LearningContentManifest,
  decks: LearningDeckSource[],
) {
  const directory = mkdtempSync(path.join(tmpdir(), 'gramio-content-'));
  temporaryDirectories.push(directory);
  writeFileSync(
    path.join(directory, 'manifest.json'),
    JSON.stringify(manifest),
  );
  manifest.deckFiles.forEach((filename, index) => {
    writeFileSync(path.join(directory, filename), JSON.stringify(decks[index]));
  });

  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('validateLearningContent', () => {
  it('normalizes a complete valid bundle', () => {
    const { manifest, decks } = createValidContent();

    const bundle = validateLearningContent(manifest, decks);

    expect(bundle.databaseContentVersion).toBe('starter@2026.07.1');
    expect(bundle.decks).toHaveLength(6);
    expect(bundle.decks.flatMap((deck) => deck.cards)).toHaveLength(120);
  });

  it.each([
    {
      name: 'duplicate deck slugs',
      mutate: ({ decks }: ReturnType<typeof cloneValidContent>) => {
        decks[1].slug = decks[0].slug;
      },
      message: 'duplicate deck slug',
    },
    {
      name: 'duplicate card keys within a deck',
      mutate: ({ decks }: ReturnType<typeof cloneValidContent>) => {
        decks[0].cards[1].contentKey = decks[0].cards[0].contentKey;
      },
      message: 'duplicate card contentKey',
    },
    {
      name: 'duplicate normalized prompts within a deck',
      mutate: ({ decks }: ReturnType<typeof cloneValidContent>) => {
        decks[0].cards[1].front = '  PROMPT   1-1  ';
      },
      message: 'duplicate normalized card front',
    },
    {
      name: 'an answer missing from options',
      mutate: ({ decks }: ReturnType<typeof cloneValidContent>) => {
        decks[0].cards[0].options = ['Wrong one', 'Wrong two'];
      },
      message: 'must contain the exact answer',
    },
    {
      name: 'duplicate options',
      mutate: ({ decks }: ReturnType<typeof cloneValidContent>) => {
        const answer = decks[0].cards[0].answer;
        decks[0].cards[0].options = [answer, answer];
      },
      message: 'duplicate value',
    },
    {
      name: 'fewer than five decks',
      mutate: (content: ReturnType<typeof cloneValidContent>) => {
        content.manifest.deckFiles = content.manifest.deckFiles.slice(0, 4);
        content.decks = content.decks.slice(0, 4);
      },
      message: 'at least 5 items',
    },
    {
      name: 'more than eight decks',
      mutate: (content: ReturnType<typeof cloneValidContent>) => {
        content.decks.push(createDeck(7), createDeck(8), createDeck(9));
        content.manifest.deckFiles.push(
          'deck-7.json',
          'deck-8.json',
          'deck-9.json',
        );
      },
      message: 'less than or equal to 8',
    },
    {
      name: 'fewer than twenty cards',
      mutate: ({ decks }: ReturnType<typeof cloneValidContent>) => {
        decks[0].cards = decks[0].cards.slice(0, 19);
      },
      message: 'at least 20 items',
    },
    {
      name: 'more than fifty cards',
      mutate: ({ decks }: ReturnType<typeof cloneValidContent>) => {
        decks[0].cards = Array.from({ length: 51 }, (_, index) =>
          createCard(1, index + 1),
        );
      },
      message: 'less than or equal to 50',
    },
    {
      name: 'blank required text',
      mutate: ({ decks }: ReturnType<typeof cloneValidContent>) => {
        decks[0].cards[0].explanation = '   ';
      },
      message: 'is not allowed to be empty',
    },
    {
      name: 'an invalid deck stable key',
      mutate: ({ decks }: ReturnType<typeof cloneValidContent>) => {
        decks[0].slug = 'Deck_One';
      },
      message: 'fails to match the required pattern',
    },
    {
      name: 'an invalid card stable key',
      mutate: ({ decks }: ReturnType<typeof cloneValidContent>) => {
        decks[0].cards[0].contentKey = 'Card_One';
      },
      message: 'fails to match the required pattern',
    },
    {
      name: 'an unsafe deck filename',
      mutate: ({ manifest }: ReturnType<typeof cloneValidContent>) => {
        manifest.deckFiles[0] = '../deck-1.json';
      },
      message: 'unsafe deck filename "../deck-1.json"',
    },
    {
      name: 'duplicate deck sort orders',
      mutate: ({ decks }: ReturnType<typeof cloneValidContent>) => {
        decks[1].sortOrder = decks[0].sortOrder;
      },
      message: 'duplicate deck sortOrder',
    },
    {
      name: 'duplicate card sort orders within a deck',
      mutate: ({ decks }: ReturnType<typeof cloneValidContent>) => {
        decks[0].cards[1].sortOrder = decks[0].cards[0].sortOrder;
      },
      message: 'duplicate card sortOrder',
    },
    {
      name: 'a database content version longer than forty characters',
      mutate: ({ manifest }: ReturnType<typeof cloneValidContent>) => {
        manifest.contentVersion = 'x'.repeat(40);
      },
      message: 'database content version must not exceed 40 characters',
    },
    {
      name: 'missing content categories',
      mutate: ({ decks }: ReturnType<typeof cloneValidContent>) => {
        decks.forEach((deck) => {
          deck.type = 'vocab';
        });
      },
      message: 'missing deck content types: grammar, tip',
    },
  ])('rejects $name', ({ mutate, message }) => {
    const content = cloneValidContent();
    mutate(content);

    expect(() =>
      validateLearningContent(content.manifest, content.decks),
    ).toThrow(message);
  });

  it.each([
    {
      name: 'manifest',
      mutate: (content: ReturnType<typeof cloneValidContent>) =>
        Object.assign(content.manifest, { extra: true }),
    },
    {
      name: 'deck',
      mutate: ({ decks }: ReturnType<typeof cloneValidContent>) =>
        Object.assign(decks[0], { extra: true }),
    },
    {
      name: 'card',
      mutate: ({ decks }: ReturnType<typeof cloneValidContent>) =>
        Object.assign(decks[0].cards[0], { extra: true }),
    },
  ])('rejects unknown fields on each $name object', ({ mutate }) => {
    const content = cloneValidContent();
    mutate(content);

    expect(() =>
      validateLearningContent(content.manifest, content.decks),
    ).toThrow('is not allowed');
  });

  it('collects all validation failures in one error', () => {
    const content = cloneValidContent();
    content.decks[0].slug = 'Invalid_Slug';
    content.decks[0].cards[0].answer = '   ';
    content.decks[1].slug = content.decks[2].slug;

    expect(() =>
      validateLearningContent(content.manifest, content.decks),
    ).toThrow(
      expect.objectContaining({
        message: expect.stringMatching(
          /fails to match the required pattern[\s\S]*is not allowed to be empty[\s\S]*duplicate deck slug/,
        ),
      }),
    );
  });
});

describe('loadLearningContent', () => {
  it('loads exactly the manifest-listed deck documents', () => {
    const { manifest, decks } = createValidContent();
    const directory = writeContentDirectory(manifest, decks);
    writeFileSync(path.join(directory, 'not-listed.json'), '{not valid json');

    const bundle = loadLearningContent(directory);

    expect(bundle.decks.map((deck) => deck.slug)).toEqual(
      decks.map((deck) => deck.slug),
    );
  });

  it('rejects an unsafe deck path', () => {
    const { manifest, decks } = createValidContent();
    const directory = writeContentDirectory(manifest, decks);
    manifest.deckFiles[0] = '../outside.json';
    writeFileSync(
      path.join(directory, 'manifest.json'),
      JSON.stringify(manifest),
    );

    expect(() => loadLearningContent(directory)).toThrow(
      'unsafe deck filename "../outside.json"',
    );
  });

  it('reports a missing manifest-listed deck file', () => {
    const { manifest, decks } = createValidContent();
    const directory = writeContentDirectory(manifest, decks);
    unlinkSync(path.join(directory, manifest.deckFiles[0]));

    expect(() => loadLearningContent(directory)).toThrow(
      `could not read ${manifest.deckFiles[0]}`,
    );
  });

  it('includes the source filename in JSON parse failures', () => {
    const { manifest, decks } = createValidContent();
    const directory = writeContentDirectory(manifest, decks);
    writeFileSync(path.join(directory, manifest.deckFiles[2]), '{not json');

    expect(() => loadLearningContent(directory)).toThrow(
      `could not parse ${manifest.deckFiles[2]}`,
    );
  });
});
