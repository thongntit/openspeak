# OpenSpeak Word Database

A static database of 3,000 most common English words with IPA pronunciation, hosted on GitHub for easy access and version control.

## 📊 Database Stats

- **Total Words:** 3,000
- **Words with IPA:** 2,929 (97.6%)
- **Words Missing IPA:** 71 (abbreviations, codes)
- **File Size:** ~449 KB
- **Format:** JSON
- **License:** Mixed (see [Data Sources](#data-sources))

## 📁 Files

```
database/
├── words.json          # Main database file (3,000 words)
└── README.md          # This file
```

## 🚀 Quick Start

### Access via GitHub Raw URL

```javascript
const DATABASE_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/openspeak/main/database/words.json';

// Fetch the database
const response = await fetch(DATABASE_URL);
const data = await response.json();

// Access words
console.log(data.words[0]); // { id: "word-1", word: "the", variants: [...] }
```

### Word Entry Format

```json
{
  "id": "word-1",
  "word": "the",
  "variants": [
    { "ipa": "/ˈðə/" },
    { "ipa": "/ðə/" },
    { "ipa": "/ði/" }
  ]
}
```

## 📚 Documentation

Comprehensive documentation is available in `/docs/database/`:

- **[Structure](./docs/database/structure.md)** - Database format, fields, and IPA notation
- **[Access](./docs/database/access.md)** - GitHub raw URLs, loading strategies, CORS, rate limits
- **[IndexedDB](./docs/database/indexeddb.md)** - Client-side storage, schema, sync, and queries
- **[Integration](./docs/database/integration.md)** - Frontend service API and usage examples

## 🏗️ Data Sources

### 1. Google 10000 English
- **Repository:** https://github.com/first20hours/google-10000-english
- **License:** Public Domain
- **Description:** Top 10,000 most common English words by frequency from Google's Trillion Word Corpus
- **Usage:** First 3,000 words from this list

### 2. IPA Dict (en_US)
- **Repository:** https://github.com/open-dict-data/ipa-dict
- **License:** MIT
- **Description:** American English IPA pronunciation dictionary with ~125,000 words
- **Usage:** IPA lookup for each word in the Google list

## 🔄 Updating the Database

To regenerate the database with updated data:

```bash
cd database
node generate.js
```

This will:
1. Fetch latest word list from Google 10000 English
2. Fetch latest IPA data from ipa-dict
3. Merge and generate words.json
4. Output statistics

## 📋 IPA Format

Each word has an array of pronunciation variants:

```json
{
  "variants": [
    { "ipa": "/ˈænd/" },    // Stressed form
    { "ipa": "/ənd/" }      // Unstressed form
  ]
}
```

- **Primary stress:** `ˈ` (e.g., `/ˈænd/`)
- **Secondary stress:** `ˌ` (e.g., `/ˌɪnˈfɔɹm/`)
- **Multiple variants:** Different pronunciations (stressed, unstressed, dialectal)

## ⚠️ Known Limitations

- **71 words missing IPA** - Mostly abbreviations ("ap", "ny", "km", "ft") and codes
- **American English only** - Uses en_US IPA data
- **Static data** - No real-time updates (version controlled via Git)

## 🔧 Frontend Integration

The recommended approach is:

1. **First load:** Fetch from GitHub → Store in IndexedDB
2. **Subsequent loads:** Use IndexedDB (offline-capable)
3. **Background:** Check for updates periodically

See [Integration Guide](./docs/database/integration.md) for complete implementation details.

## 📦 Storage Requirements

- **Download size:** ~449 KB (raw), ~120 KB (gzipped)
- **IndexedDB storage:** ~500 KB
- **Memory footprint:** Minimal (loaded on-demand)

Well within browser storage limits (typically 50-250MB available).

## 🌐 Browser Support

Works in all modern browsers:
- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge 12+
- iOS Safari 10.3+
- Android Chrome 25+

## 📝 Version History

### v1.0.0 (Current)
- 3,000 most common English words
- IPA pronunciation variants
- Generated from Google 10000 + IPA Dict

## 🤝 Contributing

To contribute improvements:

1. Update the generation script (`generate.js`)
2. Regenerate the database
3. Submit a PR with the updated `words.json`
4. Update version number if format changes

## 📄 License

The database is a compilation of:
- **Word list:** Public Domain (Google 10000 English)
- **IPA data:** MIT License (open-dict-data/ipa-dict)

The compiled database is provided as-is for educational and personal use.

## 🔗 Links

- [Main Project](../README.md)
- [Frontend Documentation](../docs/)
- [GitHub Repository](https://github.com/YOUR_USERNAME/openspeak)

---

**Questions?** See the detailed documentation in `/docs/database/` or open an issue.
