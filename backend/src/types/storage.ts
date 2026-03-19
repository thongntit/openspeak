export interface QuotaEntry {
  count: number;
  resetAt: number; // unix ms
}

export interface IQuotaStore {
  get(key: string): Promise<QuotaEntry | null>;
  set(key: string, entry: QuotaEntry): Promise<void>;
}

// Stub — not used in Phase 1, here so the interface is ready
export interface HistoryEntry {
  id?: number;
  word: string;
  score: number;
  practicedAt: number; // unix ms
}

export interface IHistoryStore {
  add(entry: Omit<HistoryEntry, 'id'>): Promise<void>;
  recent(limit: number): Promise<HistoryEntry[]>;
}
