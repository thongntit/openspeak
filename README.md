# Gramio - English Grammar & Vocabulary Practice

Mobile-first Progressive Web App for English grammar and vocabulary practice.

## Monorepo Structure

```
gramio/
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
- **Storage:** LocalStorage

### Build Tools
- **Bundler:** Vite (fast HMR, optimized builds)
- **Package Manager:** npm

## Quick Start

### 1. Install Dependencies

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
- ✅ **Grammar Exercises** - Practice common grammar patterns
- ✅ **Vocabulary Practice** - Learn and review words
- ✅ **Progress Tracking** - LocalStorage for practice history
- ✅ **Word Database** - Pre-built list of common words

### PWA Essentials
- ✅ **Installable** - Add to home screen on iOS & Android
- ✅ **Offline Support** - App shell works offline
- ✅ **Mobile-First** - Optimized for touch and small screens
- ✅ **Responsive Design** - Works on all devices
- ✅ **Fast Loading** - Optimized bundles with Vite

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
│   ├── stores/            # Zustand stores
│   │   └── settingsStore.js
│   ├── services/          # API & services
│   │   └── storage.js
│   └── utils/             # Helpers
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
│  │  ├─ Services (API)                                    ││
│  │  └─ Service Worker (offline cache)                    ││
│  └─────────────────────────────────────────────────────┘│
│                         │                                 │
│                         │ HTTPS                           │
│                         ▼                                 │
│                   Backend API                            │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
          LocalStorage (offline progress)
```

## Development Roadmap

### Phase 1: Core Features
- [ ] Grammar exercise system
- [ ] Vocabulary practice features
- [ ] Progress tracking (LocalStorage)
- [ ] Word database integration

### Phase 2: PWA & UX
- [ ] Verify PWA installation flow
- [ ] Create mobile-optimized components
- [ ] Implement install prompt UI

### Phase 3: Polish & Testing
- [ ] Test on multiple mobile devices
- [ ] Performance optimization
- [ ] Deploy to hosting

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
- [ ] Add grammar exercise types
- [ ] Add TypeScript support

## License

MIT License - Free to use and modify
