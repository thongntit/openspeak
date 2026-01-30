# Database Access

This document describes how to access and load the OpenSpeak word database from GitHub into the frontend application.

## GitHub Raw URLs

The database is hosted on GitHub and accessible via raw content URLs. This provides free, reliable hosting with built-in CDN distribution.

### URL Pattern

```
https://raw.githubusercontent.com/{username}/{repo}/{branch}/database/words.json
```

### Example

```javascript
const DATABASE_URL = 'https://raw.githubusercontent.com/thongnguyen/openspeak/main/database/words.json';
```

Replace:
- `{username}` - Your GitHub username
- `{repo}` - Repository name (e.g., "openspeak")
- `{branch}` - Branch name (e.g., "main" or "master")

## Loading Strategies

### Strategy 1: Fetch-and-Cache (Recommended)

The recommended approach for production use:

1. **First Load:** Fetch from GitHub → Store in IndexedDB
2. **Subsequent Loads:** Use IndexedDB (offline-capable)
3. **Background Updates:** Check for updates periodically

```javascript
async function loadDatabase() {
  // Check if we have cached data
  const cached = await getFromIndexedDB();
  
  if (cached) {
    // Use cached data immediately
    return cached;
  }
  
  // No cache - fetch from GitHub
  try {
    const response = await fetch(DATABASE_URL);
    const data = await response.json();
    
    // Store for future use
    await saveToIndexedDB(data);
    
    return data;
  } catch (error) {
    console.error('Failed to load database:', error);
    throw error;
  }
}
```

### Strategy 2: Always Fresh

Fetch from GitHub on every load (not recommended for production):

```javascript
async function loadDatabaseFresh() {
  const response = await fetch(DATABASE_URL);
  return await response.json();
}
```

**Pros:** Always up-to-date  
**Cons:** Slower load times, hits rate limits, requires network

### Strategy 3: Update Check with ETag

Check for updates using HTTP ETag before downloading:

```javascript
async function loadWithUpdateCheck() {
  const cached = await getFromIndexedDB();
  const lastETag = localStorage.getItem('dbETag');
  
  // Check if update available
  const headResponse = await fetch(DATABASE_URL, { method: 'HEAD' });
  const currentETag = headResponse.headers.get('ETag');
  
  if (cached && lastETag === currentETag) {
    // No update needed
    return cached;
  }
  
  // Fetch new version
  const response = await fetch(DATABASE_URL);
  const data = await response.json();
  
  // Update cache and ETag
  await saveToIndexedDB(data);
  localStorage.setItem('dbETag', currentETag);
  
  return data;
}
```

## CORS Support

GitHub raw URLs support Cross-Origin Resource Sharing (CORS) with the following headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD
```

This means you can fetch the database from any domain without CORS issues.

## Rate Limits

GitHub imposes rate limits on raw content requests:

| Type | Limit |
|------|-------|
| **Unauthenticated** | 60 requests per hour per IP |
| **Authenticated** | 5,000 requests per hour per token |

### Implications

- **Development:** 60 req/hour is sufficient for testing
- **Production:** Use IndexedDB caching to avoid repeated fetches
- **First-time users:** One fetch per user is well within limits
- **Updates:** Occasional update checks (daily/weekly) are safe

### Handling Rate Limits

If you hit the rate limit, GitHub returns HTTP 403:

```javascript
async function fetchWithRateLimitHandling() {
  try {
    const response = await fetch(DATABASE_URL);
    
    if (response.status === 403) {
      // Rate limited - use cached data or show error
      const cached = await getFromIndexedDB();
      if (cached) {
        console.warn('Rate limited, using cached data');
        return cached;
      }
      throw new Error('GitHub rate limit exceeded. Please try again later.');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}
```

## Response Headers

GitHub raw URLs provide useful headers:

| Header | Description |
|--------|-------------|
| `Content-Type` | `text/plain; charset=utf-8` |
| `Content-Length` | File size in bytes (~449,000) |
| `ETag` | Unique version identifier |
| `Cache-Control` | `max-age=300` (5 minutes) |
| `Last-Modified` | Last commit timestamp |

### Using ETag for Update Detection

```javascript
async function checkForUpdates() {
  const lastETag = localStorage.getItem('dbETag');
  
  const response = await fetch(DATABASE_URL, { method: 'HEAD' });
  const currentETag = response.headers.get('ETag');
  
  if (lastETag !== currentETag) {
    console.log('Database update available');
    return true;
  }
  
  return false;
}
```

## Error Handling

Common errors and recommended handling:

### Network Failure

```javascript
try {
  const data = await loadDatabase();
} catch (error) {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    // Network error - use cached data if available
    const cached = await getFromIndexedDB();
    if (cached) {
      return cached;
    }
    throw new Error('Network unavailable. Please check your connection.');
  }
  throw error;
}
```

### 404 Not Found

```javascript
if (response.status === 404) {
  throw new Error('Database file not found. Check the URL and ensure the file is committed.');
}
```

### JSON Parse Error

```javascript
try {
  const data = await response.json();
} catch (error) {
  if (error instanceof SyntaxError) {
    throw new Error('Invalid database format. The file may be corrupted.');
  }
  throw error;
}
```

## Performance Considerations

### Download Size

- **Raw JSON:** ~449 KB
- **Gzipped transfer:** ~120 KB (GitHub serves compressed)
- **Parse time:** ~50-100ms on modern devices
- **IndexedDB storage:** ~450 KB

### Loading Time

| Connection | Time |
|------------|------|
| 4G/LTE | 1-2 seconds |
| 3G | 3-5 seconds |
| WiFi | <1 second |
| Cached (IndexedDB) | <100ms |

### Optimization Tips

1. **Use IndexedDB** - Avoid repeated GitHub fetches
2. **Lazy loading** - Load database only when needed
3. **Background sync** - Check for updates when app is idle
4. **Progress indicator** - Show loading state for first-time users

## Security Considerations

### HTTPS Only

Always use HTTPS URLs. GitHub automatically redirects HTTP to HTTPS, but explicit HTTPS is recommended:

```javascript
// Good
const url = 'https://raw.githubusercontent.com/...';

// Avoid
const url = 'http://raw.githubusercontent.com/...'; // Will redirect
```

### Content Integrity

For production apps, consider verifying the database integrity:

```javascript
// Optional: Add checksum verification
const expectedChecksum = 'abc123...'; // Store in your app
const actualChecksum = await calculateChecksum(data);

if (expectedChecksum !== actualChecksum) {
  console.warn('Database checksum mismatch');
}
```

## Alternative Hosting

If GitHub rate limits become an issue:

1. **GitHub Releases** - Attach database as release asset (higher limits)
2. **CDN (Cloudflare, jsDelivr)** - Better caching and higher limits
3. **Self-hosted** - Host on your own server or S3
4. **Split into chunks** - Multiple smaller files (not recommended at current size)

## Implementation Example

Complete implementation combining all best practices:

```javascript
const DATABASE_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/openspeak/main/database/words.json';
const DB_CACHE_KEY = 'openspeak_words';
const DB_ETAG_KEY = 'openspeak_db_etag';

async function initializeDatabase() {
  // Try to get cached data first
  const cached = await getFromIndexedDB(DB_CACHE_KEY);
  
  if (cached) {
    // Check for updates in background
    checkForUpdates().then(hasUpdate => {
      if (hasUpdate) {
        console.log('Database update available');
        // Optionally: show "Update available" notification
      }
    });
    
    return cached;
  }
  
  // No cache - must fetch
  try {
    const response = await fetch(DATABASE_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const etag = response.headers.get('ETag');
    
    // Cache the data
    await saveToIndexedDB(DB_CACHE_KEY, data);
    localStorage.setItem(DB_ETAG_KEY, etag);
    
    return data;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw new Error('Unable to load word database. Please check your connection and try again.');
  }
}

async function checkForUpdates() {
  try {
    const lastETag = localStorage.getItem(DB_ETAG_KEY);
    const response = await fetch(DATABASE_URL, { method: 'HEAD' });
    const currentETag = response.headers.get('ETag');
    
    return lastETag !== currentETag;
  } catch (error) {
    console.warn('Update check failed:', error);
    return false;
  }
}
```

See [indexeddb.md](./indexeddb.md) for IndexedDB implementation details.

## Local Testing

For development and testing, you can serve the database locally instead of fetching from GitHub.

### Quick Start (Recommended)

From the project root, run both the database server and frontend:

```bash
# Terminal 1: Start the database server
bun run serve-db

# Terminal 2: Start the frontend dev server
bun run dev
```

Or use the combined command (runs both in parallel):

```bash
bun run dev:local
```

### Step 1: Start the Local Database Server

```bash
# Using bun (recommended)
bun run serve-db

# Or with custom port
bun run serve-db:3001

# Or directly with bun
bun scripts/serve-db.js
```

This will start a server on `http://localhost:3001` with:
- ✅ CORS enabled for frontend access
- ✅ ETag support for update checking
- ✅ Proper JSON content-type headers
- ✅ 304 caching support

### Step 2: Configure Frontend Environment

Create a `.env` file in the `frontend/` directory:

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env` to point to your local server:

```env
VITE_DATABASE_URL=http://localhost:3001/words.json
```

### Step 3: Start the Frontend

```bash
# From project root (recommended)
bun run dev

# Or from frontend directory
cd frontend && bun run dev
```

The frontend will now fetch from your local server instead of GitHub.

### Benefits of Local Testing

1. **No rate limits** - Test as much as you want
2. **Fast iteration** - Changes to database are immediately available
3. **Offline development** - No internet required after initial setup
4. **Debugging** - Easy to inspect network requests and responses
5. **Custom data** - Modify `words.json` for testing specific scenarios

### Switching Back to GitHub

To use the production GitHub URL, either:

1. **Comment out the local URL in `.env`:**
   ```env
   # VITE_DATABASE_URL=http://localhost:3001/words.json
   ```

2. **Or set the GitHub URL explicitly:**
   ```env
   VITE_DATABASE_URL=https://raw.githubusercontent.com/YOUR_USERNAME/openspeak/main/database/words.json
   ```

### Environment Variable Priority

The frontend uses this priority for the database URL:

1. `VITE_DATABASE_URL` environment variable (if set)
2. Fallback to GitHub raw URL (hardcoded)

This allows easy switching between local and production without code changes.
