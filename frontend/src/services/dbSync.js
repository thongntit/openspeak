// Database synchronization service
// Handles fetching data from GitHub and syncing to IndexedDB

import { openDatabase, clearWords, saveWords, countWords } from './db.js';

// Database URL from environment variable or fallback to GitHub
// For local testing, use: VITE_DATABASE_URL=http://localhost:3001/words.json
const DATABASE_URL = import.meta.env.VITE_DATABASE_URL || 'https://raw.githubusercontent.com/thongnguyen/openspeak/main/database/words.json';

// Storage keys for metadata
const STORAGE_KEYS = {
  lastSync: 'openspeak_db_last_sync',
  version: 'openspeak_db_version',
  totalWords: 'openspeak_db_total_words',
  etag: 'openspeak_db_etag'
};

/**
 * Custom error for sync failures
 */
export class SyncError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = 'SyncError';
  }
}

/**
 * Fetch the database from GitHub
 * @returns {Promise<Object>} Database object
 */
export async function fetchFromGitHub() {
  try {
    const response = await fetch(DATABASE_URL);
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new SyncError(
          'GitHub rate limit exceeded. Please try again later.',
          'RATE_LIMIT'
        );
      }
      if (response.status === 404) {
        throw new SyncError(
          'Database file not found. Please check the URL.',
          'NOT_FOUND'
        );
      }
      throw new SyncError(
        `HTTP ${response.status}: ${response.statusText}`,
        'HTTP_ERROR'
      );
    }
    
    // Get ETag for update checking
    const etag = response.headers.get('ETag');
    
    // Parse JSON
    let data;
    try {
      data = await response.json();
    } catch {
      throw new SyncError(
        'Invalid database format. The file may be corrupted.',
        'PARSE_ERROR'
      );
    }
    
    // Validate structure
    if (!data.words || !Array.isArray(data.words)) {
      throw new SyncError(
        'Invalid database structure: missing words array',
        'INVALID_STRUCTURE'
      );
    }
    
    return { data, etag };
    
  } catch (error) {
    if (error instanceof SyncError) {
      throw error;
    }
    
    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new SyncError(
        'Network error. Please check your connection.',
        'NETWORK_ERROR'
      );
    }
    
    throw new SyncError(
      `Failed to fetch database: ${error.message}`,
      'UNKNOWN_ERROR'
    );
  }
}

/**
 * Sync database from GitHub to IndexedDB
 * @param {Function} onProgress - Optional progress callback (current, total)
 * @returns {Promise<Object>} Sync result
 */
export async function syncFromGitHub(onProgress = null) {
  const db = await openDatabase();
  
  try {
    // Fetch from GitHub
    console.log('Fetching database from GitHub...');
    const { data, etag } = await fetchFromGitHub();
    
    // Validate word count
    if (data.words.length === 0) {
      throw new SyncError('Database contains no words', 'EMPTY_DATABASE');
    }
    
    console.log(`Fetched ${data.words.length} words, syncing to IndexedDB...`);
    
    // Clear existing data
    await clearWords(db);
    console.log('Cleared existing data');
    
    // Save words with progress tracking
    const total = data.words.length;
    let saved = 0;
    const batchSize = 100;
    
    for (let i = 0; i < total; i += batchSize) {
      const batch = data.words.slice(i, i + batchSize);
      await saveWords(db, batch);
      saved += batch.length;
      
      if (onProgress) {
        onProgress(saved, total);
      }
      
      // Small delay to prevent UI blocking
      if (i + batchSize < total) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    // Verify count
    const actualCount = await countWords(db);
    if (actualCount !== total) {
      console.warn(`Word count mismatch: expected ${total}, got ${actualCount}`);
    }
    
    // Store metadata
    localStorage.setItem(STORAGE_KEYS.lastSync, new Date().toISOString());
    localStorage.setItem(STORAGE_KEYS.version, data.version || '1.0.0');
    localStorage.setItem(STORAGE_KEYS.totalWords, actualCount.toString());
    if (etag) {
      localStorage.setItem(STORAGE_KEYS.etag, etag);
    }
    
    console.log(`Sync complete: ${actualCount} words saved`);
    
    return {
      success: true,
      count: actualCount,
      version: data.version,
      wordsWithIpa: data.wordsWithIpa,
      wordsMissingIpa: data.wordsMissingIpa
    };
    
  } catch (error) {
    console.error('Sync failed:', error);
    
    return {
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    };
  }
}

/**
 * Check if an update is available
 * @returns {Promise<Object>} Update status
 */
export async function checkForUpdates() {
  try {
    const lastETag = localStorage.getItem(STORAGE_KEYS.etag);
    
    // Fetch headers only
    const response = await fetch(DATABASE_URL, { method: 'HEAD' });
    
    if (!response.ok) {
      return {
        hasUpdate: false,
        error: `HTTP ${response.status}`
      };
    }
    
    const currentETag = response.headers.get('ETag');
    
    // If no previous ETag, assume update needed
    if (!lastETag) {
      return {
        hasUpdate: true,
        reason: 'No previous sync'
      };
    }
    
    // Compare ETags
    const hasUpdate = lastETag !== currentETag;
    
    return {
      hasUpdate,
      currentETag,
      lastETag
    };
    
  } catch (error) {
    console.warn('Update check failed:', error);
    return {
      hasUpdate: false,
      error: error.message
    };
  }
}

/**
 * Get sync metadata
 * @returns {Object} Sync metadata
 */
export function getSyncMetadata() {
  return {
    lastSync: localStorage.getItem(STORAGE_KEYS.lastSync),
    version: localStorage.getItem(STORAGE_KEYS.version),
    totalWords: parseInt(localStorage.getItem(STORAGE_KEYS.totalWords) || '0'),
    etag: localStorage.getItem(STORAGE_KEYS.etag)
  };
}

/**
 * Check if database needs initial sync
 * @returns {Promise<boolean>}
 */
export async function needsSync() {
  try {
    const db = await openDatabase();
    const count = await countWords(db);
    return count === 0;
  } catch (error) {
    console.error('Error checking if sync needed:', error);
    return true;
  }
}

/**
 * Clear all sync data (for testing/reset)
 * @returns {Promise<void>}
 */
export async function clearSyncData() {
  const db = await openDatabase();
  await clearWords(db);
  
  // Clear metadata
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('Sync data cleared');
}

// Export configuration
export { DATABASE_URL, STORAGE_KEYS };
