# English Pronunciation Coach - PWA MVP

Mobile-first Progressive Web App for English pronunciation assessment with Azure Speech Services.

## Monorepo Structure

```
openspeak/
├── frontend/               # React + Vite + Tailwind PWA
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── stores/         # Zustand state management
│   │   ├── services/       # API & services
│   │   └── utils/          # Helper functions
│   ├── public/             # Static assets
│   ├── .env.example        # Environment variables template
│   ├── package.json
│   ├── vite.config.js      # Vite + PWA config
│   └── tailwind.config.js  # Tailwind CSS config
├── database/               # Static word database
│   ├── words.json          # 3,000 words with IPA (449 KB)
│   └── README.md           # Database documentation
├── docs/                   # Documentation
│   ├── database/           # Database integration guides
│   │   ├── structure.md
│   │   ├── access.md
│   │   ├── indexeddb.md
│   │   └── integration.md
│   ├── CHANGELOG.md
│   └── spec.md
├── scripts/                # Utility scripts
│   └── serve-db.js         # Local database server
├── package.json            # Root package.json with scripts
└── README.md               # This file
```

## Tech Stack

### Frontend
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS (mobile-first)
- **State Management:** Zustand
- **PWA:** vite-plugin-pwa (auto service worker)
- **Speech:** Azure Speech SDK v1.40+ (CDN)
- **Storage:** LocalStorage

### Build Tools
- **Bundler:** Vite (fast HMR, optimized builds)
- **Package Manager:** npm

## Quick Start

### 1. Get Azure Speech Service Key (Free Tier)

1. Visit [Azure Portal](https://portal.azure.com/)
2. Create account → **"Create a resource"** → Search **"Speech Service"**
3. Select **Free (F0)** tier (5 hours/month free)
4. Go to **"Keys and Endpoint"**
5. Copy **Key 1** and **Region** (e.g., `southeastasia`)

### 2. Install Dependencies

```bash
cd frontend
bun install
```

### 3. Run Development Server

**Option A: Quick Start (uses GitHub database)**
```bash
# From project root
bun run dev
```

**Option B: Local Database (recommended for development)**
```bash
# Terminal 1: Start local database server
bun run serve-db

# Terminal 2: Start frontend (with local database)
bun run dev
```

Or use the combined command:
```bash
bun run dev:local
```

Open browser: **http://localhost:5173**

> **Why localhost?** Browser requires HTTPS or localhost for microphone access.

### 4. Build for Production

```bash
bun run build
bun run preview  # Preview production build
```

### 4. Install as PWA

- **iOS Safari:** Tap Share → Add to Home Screen
- **Android Chrome:** Menu → Install App / Add to Home Screen

## MVP Features

### Core Features
- ✅ **Single Word Practice** - Input word, record, get instant feedback
- ✅ **Phrase Practice** - Short sentences (3-5 words)
- ✅ **Scoring System** - 0-100 accuracy + prosody score
- ✅ **Visual Feedback** - Color-coded word/phoneme breakdown
- ✅ **Progress Tracking** - LocalStorage for practice history
- ✅ **Word Suggestions** - Pre-built list of common words

### PWA Essentials
- ✅ **Installable** - Add to home screen on iOS & Android
- ✅ **Offline Support** - App shell works offline
- ✅ **Mobile-First** - Optimized for touch and small screens
- ✅ **Responsive Design** - Works on all devices
- ✅ **Fast Loading** - Optimized bundles with Vite

## Pricing & Usage

### Azure Speech Service Costs

| API Type | Price/Hour | Current |
|----------|------------|---------|
| **Real-time (SDK)** | $1.30/hr | ✅ Using |

**Realistic Usage Cost (30 min/day):**
- ~4 min/day of actual audio recording
- 2 hours/month × $1.30/hr = **$2.60/month**

**With Free Tier:**
- First 5 hours/month: **FREE**
- Covers 2.5 months of normal usage ✅

## Development

### Available Commands (from project root)

```bash
# Development
bun run dev              # Start frontend dev server
bun run serve-db         # Start local database server (port 3001)
bun run dev:local        # Start both database server and frontend

# Building
bun run build            # Build frontend for production
bun run preview          # Preview production build

# Database
bun run db:generate      # Regenerate database from sources
bun run db:status        # Show database file stats

# Utilities
bun run lint             # Run ESLint
bun run clean            # Clean build cache
bun run setup            # Install frontend dependencies
```

### Frontend Commands (from frontend/ directory)

```bash
cd frontend

# Development
bun run dev              # Start dev server
bun run build            # Build for production
bun run preview          # Preview production build
bun run lint             # Run ESLint
```

### Project Structure Details

```
frontend/
├── src/
│   ├── main.jsx           # React entry point
│   ├── App.jsx            # Main app component
│   ├── index.css          # Tailwind imports
│   ├── components/        # React components
│   │   ├── PronunciationForm.jsx
│   │   ├── ScoreDisplay.jsx
│   │   └── WordSuggestions.jsx
│   ├── stores/            # Zustand stores
│   │   ├── pronunciationStore.js
│   │   └── settingsStore.js
│   ├── services/          # API & services
│   │   ├── azureSpeech.js
│   │   └── storage.js
│   └── utils/             # Helpers
│       ├── audio.js
│       └── formatting.js
├── public/                # Static assets
│   └── icons/             # PWA icons
└── package.json
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Mobile Browser (PWA)                     │
│  ┌─────────────────────────────────────────────────────┐│
│  │  React App (Vite)                                     ││
│  │  ├─ Components (mobile-optimized)                     ││
│  │  ├─ Zustand Stores (state)                            ││
│  │  ├─ Services (Azure Speech)                           ││
│  │  └─ Service Worker (offline cache)                    ││
│  └─────────────────────────────────────────────────────┘│
│                         │                                 │
│                         │ HTTPS                           │
│                         ▼                                 │
│              Azure Speech Service API                    │
│              (Pronunciation Assessment)                  │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
          LocalStorage (offline progress)
```

## Development Roadmap

### Week 1: Core Features
- [ ] Set up project structure
- [ ] Implement single-word assessment
- [ ] Create pronunciation store (Zustand)
- [ ] Add progress tracking (LocalStorage)
- [ ] Create word suggestion system

### Week 2: PWA & UX
- [ ] Verify PWA installation flow
- [ ] Create mobile-optimized components
- [ ] Implement install prompt UI
- [ ] Add visual feedback (waveform, animations)

### Week 3: Polish & Testing
- [ ] Add phrase practice (3-5 words)
- [ ] Implement retry mechanism
- [ ] Test on multiple mobile devices
- [ ] Performance optimization

### Week 4: Launch Prep
- [ ] Final UX polish (animations, transitions)
- [ ] Write user guide/help section
- [ ] Test PWA installation flow
- [ ] Deploy to hosting (Vercel/Netlify)

## Word Database

The app includes a static database of **3,000 most common English words** with IPA pronunciation data.

### Database Stats
- **Total Words:** 3,000
- **Words with IPA:** 2,929 (97.6%)
- **File Size:** ~449 KB
- **Format:** JSON with GitHub hosting

### Data Sources
- **Word List:** Google 10000 English (Public Domain)
- **IPA Data:** open-dict-data/ipa-dict (MIT License)

### Local Development

For development, you can serve the database locally to avoid GitHub rate limits:

```bash
# Start local database server
bun run serve-db

# Configure frontend to use local server
cp frontend/.env.example frontend/.env
# Edit frontend/.env: VITE_DATABASE_URL=http://localhost:3001/words.json

# Start frontend
bun run dev
```

See [docs/database/](./docs/database/) for detailed integration documentation.

## Troubleshooting

### Microphone Issues

**"Microphone not allowed"**
- Click lock icon in browser → Allow microphone
- Must use HTTPS or localhost

**"No audio detected"**
- Check microphone permissions
- Speak louder/closer to mic

### API Issues

**"Invalid API key"**
- Verify Key and Region match Azure Portal
- Check Speech Service resource is active

### Development Issues

**Tailwind not working**
- Check `tailwind.config.js` content paths
- Ensure `@tailwind` directives in `index.css`

**PWA not installing**
- Check HTTPS (or localhost)
- Verify manifest in `vite.config.js`
- Check console for errors

## Contributing

This is an MVP. Contributions welcome for:
- [ ] Add more word categories
- [ ] Improve mobile UI/UX
- [ ] Add gamification features
- [ ] Offline mode with browser Speech API
- [ ] Add TypeScript support

## License

MIT License - Free to use and modify
