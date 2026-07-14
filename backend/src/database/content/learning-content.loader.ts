import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  learningContentManifestSchema,
  learningDeckSourceSchema,
} from './learning-content.schema';
import {
  LearningContentBundle,
  LearningContentManifest,
  LearningContentType,
  LearningDeckSource,
} from './learning-content.types';

const validationOptions = {
  abortEarly: false,
  convert: true,
};

function validationMessages(error: Error | undefined, prefix: string) {
  if (!error || !('details' in error)) {
    return [];
  }

  return (error as Error & { details: { message: string }[] }).details.map(
    (detail) => `${prefix}: ${detail.message}`,
  );
}

function throwValidationErrors(messages: string[]): never {
  throw new Error(
    `Learning content validation failed:\n${messages
      .map((message) => `- ${message}`)
      .join('\n')}`,
  );
}

function normalizePrompt(prompt: string) {
  return prompt.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

function findDuplicates<T>(items: T[], key: (item: T) => string | number) {
  const seen = new Set<string | number>();
  const duplicates = new Set<string | number>();

  for (const item of items) {
    const value = key(item);
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }

  return [...duplicates];
}

function isLearningDeckSource(value: unknown): value is LearningDeckSource {
  return typeof value === 'object' && value !== null;
}

function collectBundleErrors(
  manifest: LearningContentManifest,
  decks: LearningDeckSource[],
) {
  const messages: string[] = [];
  const databaseContentVersion = `${manifest.namespace}@${manifest.contentVersion}`;

  for (const filename of manifest.deckFiles) {
    if (!isSafeDeckFilename(filename)) {
      messages.push(`unsafe deck filename "${filename}"`);
    }
  }

  if (databaseContentVersion.length > 40) {
    messages.push('database content version must not exceed 40 characters');
  }

  if (manifest.deckFiles.length !== decks.length) {
    messages.push(
      `manifest lists ${manifest.deckFiles.length} deck files but received ${decks.length} deck documents`,
    );
  }

  for (const slug of findDuplicates(decks, (deck) => deck.slug)) {
    messages.push(`duplicate deck slug "${slug}"`);
  }
  for (const order of findDuplicates(decks, (deck) => deck.sortOrder)) {
    messages.push(`duplicate deck sortOrder ${order}`);
  }

  const requiredTypes: LearningContentType[] = ['vocab', 'grammar', 'tip'];
  const presentTypes = new Set(decks.map((deck) => deck.type));
  const missingTypes = requiredTypes.filter((type) => !presentTypes.has(type));
  if (missingTypes.length > 0) {
    messages.push(`missing deck content types: ${missingTypes.join(', ')}`);
  }

  for (const deck of decks) {
    if (!Array.isArray(deck.cards)) {
      continue;
    }

    for (const contentKey of findDuplicates(
      deck.cards,
      (card) => card.contentKey,
    )) {
      messages.push(
        `duplicate card contentKey "${contentKey}" in deck "${deck.slug}"`,
      );
    }
    for (const front of findDuplicates(deck.cards, (card) =>
      typeof card.front === 'string'
        ? normalizePrompt(card.front)
        : String(card.front),
    )) {
      messages.push(
        `duplicate normalized card front "${front}" in deck "${deck.slug}"`,
      );
    }
    for (const order of findDuplicates(deck.cards, (card) => card.sortOrder)) {
      messages.push(`duplicate card sortOrder ${order} in deck "${deck.slug}"`);
    }

    deck.cards.forEach((card, index) => {
      if (Array.isArray(card.options) && !card.options.includes(card.answer)) {
        messages.push(
          `deck "${deck.slug}" card ${index + 1} options must contain the exact answer`,
        );
      }
    });
  }

  return messages;
}

export function validateLearningContent(
  manifestDocument: LearningContentManifest,
  deckDocuments: LearningDeckSource[],
): LearningContentBundle {
  const messages: string[] = [];
  const manifestResult = learningContentManifestSchema.validate(
    manifestDocument,
    validationOptions,
  );
  messages.push(...validationMessages(manifestResult.error, 'manifest'));

  const deckResults = deckDocuments.map((deck, index) => {
    const result = learningDeckSourceSchema.validate(deck, validationOptions);
    messages.push(
      ...validationMessages(result.error, `deckDocuments[${index}]`),
    );
    return result.value as unknown;
  });

  const manifest = manifestResult.value as LearningContentManifest;
  const decks = deckResults.filter(isLearningDeckSource);

  if (
    manifest &&
    Array.isArray(manifest.deckFiles) &&
    typeof manifest.namespace === 'string' &&
    typeof manifest.contentVersion === 'string'
  ) {
    messages.push(...collectBundleErrors(manifest, decks));
  }

  if (messages.length > 0) {
    throwValidationErrors(messages);
  }

  return {
    schemaVersion: manifest.schemaVersion,
    namespace: manifest.namespace,
    contentVersion: manifest.contentVersion,
    databaseContentVersion: `${manifest.namespace}@${manifest.contentVersion}`,
    decks,
  };
}

function parseJson(source: string, filename: string): unknown {
  try {
    return JSON.parse(source) as unknown;
  } catch {
    throw new Error(`Learning content could not parse ${filename} as JSON`);
  }
}

function readJsonFile(contentDirectory: string, filename: string): unknown {
  let source: string;
  try {
    source = readFileSync(path.join(contentDirectory, filename), 'utf8');
  } catch {
    throw new Error(`Learning content could not read ${filename}`);
  }

  return parseJson(source, filename);
}

function isSafeDeckFilename(filename: string) {
  return (
    filename.length > 0 &&
    !path.isAbsolute(filename) &&
    path.basename(filename) === filename &&
    !filename.includes('/') &&
    !filename.includes('\\') &&
    !filename.includes('\0')
  );
}

export function loadLearningContent(
  contentDirectory = path.join(__dirname, 'starter'),
): LearningContentBundle {
  const manifestDocument = readJsonFile(
    contentDirectory,
    'manifest.json',
  ) as LearningContentManifest;
  const manifestResult = learningContentManifestSchema.validate(
    manifestDocument,
    validationOptions,
  );

  if (manifestResult.error) {
    throwValidationErrors(validationMessages(manifestResult.error, 'manifest'));
  }

  const manifest = manifestResult.value;
  const unsafeFilenames = manifest.deckFiles.filter(
    (filename) => !isSafeDeckFilename(filename),
  );
  if (unsafeFilenames.length > 0) {
    throwValidationErrors(
      unsafeFilenames.map((filename) => `unsafe deck filename "${filename}"`),
    );
  }

  const decks = manifest.deckFiles.map((filename) =>
    readJsonFile(contentDirectory, filename),
  ) as LearningDeckSource[];

  return validateLearningContent(manifest, decks);
}
