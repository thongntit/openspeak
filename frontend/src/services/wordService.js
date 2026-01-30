// Word service for OpenSpeak
// Provides high-level API for word operations using IndexedDB

import {
  openDatabase,
  getWordById as dbGetWordById,
  getWordByText as dbGetWordByText,
  searchWords as dbSearchWords,
  getRandomWord as dbGetRandomWord,
  countWords,
  hasWords
} from './db.js';

import {
  syncFromGitHub,
  checkForUpdates,
  needsSync,
  getSyncMetadata
} from './dbSync.js';

/**
 * Custom errors
 */
export class DatabaseNotReadyError extends Error {
  constructor() {
    super('Database not initialized. Please wait for sync to complete.');
    this.code = 'DB_NOT_READY';
    this.name = 'DatabaseNotReadyError';
  }
}

export class InvalidWordIdError extends Error {
  constructor(id) {
    super(`Invalid word ID format: ${id}. Expected format: "word-{number}"`);
    this.code = 'INVALID_WORD_ID';
    this.name = 'InvalidWordIdError';
  }
}

/**
 * WordService class
 * Manages word database operations with IndexedDB backend
 */
class WordService {
  constructor() {
    this.db = null;
    this.dbPromise = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the word service
   * Checks for cached data and triggers sync if needed
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Open database
      this.db = await openDatabase();
      
      // Check if we need to sync
      const needsInitialSync = await needsSync();
      
      if (needsInitialSync) {
        console.log('Database empty, syncing from GitHub...');
        const result = await syncFromGitHub();
        
        if (!result.success) {
          throw new Error(`Failed to sync database: ${result.error}`);
        }
        
        console.log(`Database synced: ${result.count} words`);
      } else {
        const meta = getSyncMetadata();
        console.log(`Using cached database: ${meta.totalWords} words (v${meta.version})`);
        
        // Check for updates in background
        this.checkForUpdatesInBackground();
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize word service:', error);
      throw error;
    }
  }

  /**
   * Ensure database is initialized
   * @private
   */
  _ensureInitialized() {
    if (!this.isInitialized || !this.db) {
      throw new DatabaseNotReadyError();
    }
  }

  /**
   * Validate word ID format
   * @private
   * @param {string} id 
   */
  _validateWordId(id) {
    if (!/^word-\d+$/.test(id)) {
      throw new InvalidWordIdError(id);
    }
  }

  /**
   * Check for updates in background
   * @private
   */
  async checkForUpdatesInBackground() {
    try {
      const updateStatus = await checkForUpdates();
      
      if (updateStatus.hasUpdate) {
        console.log('Database update available');
        // Could emit event or set flag for UI to show update notification
      }
    } catch (error) {
      // Silently fail - update check is not critical
      console.warn('Background update check failed:', error);
    }
  }

  /**
   * Get a word by ID
   * @param {string} id - Word ID (e.g., "word-1")
   * @returns {Promise<Object|null>} Word object or null
   */
  async getWordById(id) {
    this._ensureInitialized();
    this._validateWordId(id);
    
    return dbGetWordById(this.db, id);
  }

  /**
   * Get a word by text
   * @param {string} text - Word text (case-insensitive)
   * @returns {Promise<Object|null>} Word object or null
   */
  async getWordByText(text) {
    this._ensureInitialized();
    
    if (!text || typeof text !== 'string') {
      return null;
    }
    
    return dbGetWordByText(this.db, text.trim());
  }

  /**
   * Search words by prefix
   * @param {string} prefix - Search prefix
   * @param {number} limit - Maximum results (default: 20)
   * @returns {Promise<Array>} Array of matching words
   */
  async searchWords(prefix, limit = 20) {
    this._ensureInitialized();
    
    if (!prefix || typeof prefix !== 'string' || prefix.trim() === '') {
      return [];
    }
    
    return dbSearchWords(this.db, prefix.trim(), limit);
  }

  /**
   * Get a random word
   * @param {Object} filter - Optional filter
   * @param {string} filter.difficulty - 'easy', 'medium', or 'hard'
   * @returns {Promise<Object|null>} Random word or null
   */
  async getRandomWord(filter = null) {
    this._ensureInitialized();
    
    let wordFilter = null;
    
    // Build filter function if difficulty specified
    if (filter && filter.difficulty) {
      wordFilter = (word) => {
        // Filter by difficulty based on syllable count in IPA
        // This is a simplified implementation
        const hasVariants = word.variants && word.variants.length > 0;
        if (!hasVariants) return false;
        
        const ipa = word.variants[0].ipa;
        const syllableCount = (ipa.match(/[ˈˌ]/g) || []).length + 1;
        
        switch (filter.difficulty) {
          case 'easy':
            return syllableCount <= 2;
          case 'medium':
            return syllableCount === 3;
          case 'hard':
            return syllableCount >= 4;
          default:
            return true;
        }
      };
    } else {
      // Default filter: only words with IPA
      wordFilter = (word) => word.variants && word.variants.length > 0;
    }
    
    return dbGetRandomWord(this.db, wordFilter);
  }

  /**
   * Get IPA for a word
   * @param {string} wordId - Word ID
   * @param {Object} options - Options
   * @param {boolean} options.all - Return all variants
   * @returns {Promise<string|Array|null>} IPA string, array, or null
   */
  async getWordIpa(wordId, options = {}) {
    this._ensureInitialized();
    this._validateWordId(wordId);
    
    const word = await dbGetWordById(this.db, wordId);
    
    if (!word || !word.variants || word.variants.length === 0) {
      return null;
    }
    
    if (options.all) {
      return word.variants.map(v => v.ipa);
    }
    
    return word.variants[0].ipa;
  }

  /**
   * Get total word count
   * @returns {Promise<number>}
   */
  async getWordCount() {
    this._ensureInitialized();
    return countWords(this.db);
  }

  /**
   * Check if database is ready
   * @returns {Promise<boolean>}
   */
  async isReady() {
    if (!this.db) {
      return false;
    }
    
    try {
      return await hasWords(this.db);
    } catch {
      return false;
    }
  }

  /**
   * Force a database sync
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Sync result
   */
  async sync(onProgress = null) {
    if (!this.db) {
      this.db = await openDatabase();
    }
    
    return syncFromGitHub(onProgress);
  }

  /**
   * Get sync metadata
   * @returns {Object}
   */
  getMetadata() {
    return getSyncMetadata();
  }
}

// Export singleton instance
export default new WordService();

// Also export individual functions for convenience
export const {
  initialize,
  getWordById,
  getWordByText,
  searchWords,
  getRandomWord,
  getWordIpa,
  getWordCount,
  isReady,
  sync,
  getMetadata
} = new WordService();
