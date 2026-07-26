export type LearningContentType = 'vocab' | 'grammar' | 'tip';
export type LearningLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LearningContentManifest {
  schemaVersion: 1;
  namespace: 'starter';
  contentVersion: string;
  deckFiles: string[];
}

export interface LearningCardSource {
  contentKey: string;
  type: LearningContentType;
  level: LearningLevel;
  front: string;
  answer: string;
  explanation: string;
  example: string;
  options?: string[];
  sortOrder: number;
}

export interface LearningDeckSource {
  slug: string;
  name: string;
  description: string;
  type: LearningContentType;
  level: LearningLevel;
  sortOrder: number;
  isPublished: boolean;
  cards: LearningCardSource[];
}

export interface LearningContentBundle {
  schemaVersion: 1;
  namespace: 'starter';
  contentVersion: string;
  databaseContentVersion: string;
  decks: LearningDeckSource[];
}
