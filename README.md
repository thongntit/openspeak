# English Pronunciation Coach - PWA MVP

Mobile-first Progressive Web App for English pronunciation assessment with Azure Speech Services.

## Monorepo Structure

```
english-pronunciation-web/
├── frontend/               # React + Vite + Tailwind PWA
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── stores/         # Zustand state management
│   │   ├── services/       # API & services
│   │   └── utils/          # Helper functions
│   ├── public/             # Static assets
│   ├── package.json
│   ├── vite.config.js      # Vite + PWA config
│   └── tailwind.config.js  # Tailwind CSS config
├── docs/                  # Documentation & archives
│   ├── CHANGELOG.md
│   ├── spec.md
│   ├── TECHNICAL_NOTES.md
│   └── phase1-mvp/         # Experimental AI conversation (archived)
├── index.html              # Legacy vanilla JS (to be removed)
└── README.md              # This file
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

### 2. Run Frontend Development Server

```bash
cd frontend
npm install
npm run dev
```

Open browser: **http://localhost:5173**

> **Why localhost?** Browser requires HTTPS or localhost for microphone access.

### 3. Build for Production

```bash
cd frontend
npm run build
npm run preview  # Preview production build
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

### Frontend Commands

```bash
cd frontend

# Development
npm run dev          # Start dev server

# Building
npm run build        # Build for production
npm run preview      # Preview production build

# Linting
npm run lint         # Run ESLint

# Type checking (if TypeScript added later)
npm run type-check   # Run TypeScript check
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
