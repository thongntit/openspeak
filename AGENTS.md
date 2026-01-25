# Agent Instructions for English Pronunciation Web

## Project Overview

Mobile-first Progressive Web App (PWA) for English pronunciation assessment using Azure Speech Services. Built with React 19, Vite, Tailwind CSS, and Zustand.

## Commands

### Development
```bash
cd frontend
bun run dev          # Start dev server on http://localhost:5173
bun run build        # Build for production
bun run preview      # Preview production build
bun run lint         # Run ESLint (auto-fix with --fix)
```

### Testing
This project currently does not have a test framework configured. When adding tests:
- Check `package.json` for available test scripts
- If using Vitest/Jest: run `bun test` or `bun run test:watch` for single test
- Use test file patterns: `*.test.{js,jsx}` or `*.spec.{js,jsx}`

## Code Style Guidelines

### File Organization
```
frontend/src/
├── components/     # Reusable React components (PascalCase.jsx)
├── pages/          # Route components (PascalCase.jsx)
├── stores/         # Zustand stores (camelCase.js)
├── services/       # External API services (camelCase.js)
├── utils/          # Helper functions (camelCase.js)
├── App.jsx         # Main app component
└── main.jsx        # React entry point
```

### Imports
```jsx
// 1. React imports
import { useEffect, useState } from 'react';

// 2. Third-party libraries
import { useNavigate } from 'react-router-dom';
import { create } from 'zustand';

// 3. Local imports (grouped by type)
import { useSettingsStore } from '../stores/settingsStore';
import AzureSpeechService from '../services/azureSpeech';
```

### Component Style
```jsx
// Functional components with named export
export default function ComponentName() {
  // Hooks at the top
  const [state, setState] = useState(null);
  
  // Event handlers
  const handleClick = () => { ... };
  
  // Render
  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
}

// Named exports for multiple exports
export const HelperComponent = () => { ... };
```

### Services Pattern
```js
// Singleton pattern for services
class ServiceName {
  constructor() {
    this.property = null;
  }

  initialize(config) {
    try {
      // Init logic
      return true;
    } catch (error) {
      console.error('Service init error:', error);
      throw error;
    }
  }

  async method() {
    if (!this.property) {
      throw new Error('Service not initialized');
    }
    // Logic
  }

  cleanup() {
    // Cleanup resources
  }
}

export default new ServiceName();
```

### State Management (Zustand)
```js
import { create } from 'zustand';

export const useStoreName = create((set) => ({
  state: null,
  error: null,
  
  setState: (state) => set({ state, error: null }),
  setError: (error) => set({ error, state: null }),
  clearError: () => set({ error: null }),
}));
```

### Styling (Tailwind CSS)
- Use Tailwind utility classes for all styling
- Custom component classes defined in `src/index.css` under `@layer components`
- Available custom classes: `.btn-primary`, `.btn-secondary`, `.card`, `.input`
- Always include dark mode variants: `dark:bg-[#101922]`, `dark:text-white`
- Use semantic color classes: `text-[#111418]`, `bg-[#137fec]`, `text-[#637588]`
- Mobile-first approach: default styles for mobile, `md:`+ for tablets/desktop

### Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.jsx`, `NavigationHeader.jsx`)
- **Functions/Variables**: camelCase (e.g., `handleClick`, `userName`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`, `MAX_RETRIES`)
- **Files**:
  - Components: `PascalCase.jsx`
  - Pages: `PascalCase.jsx`
  - Services/Stores: `camelCase.js`
  - Utilities: `camelCase.js`

### Error Handling
```js
// Always wrap async operations in try-catch
try {
  const result = await operation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  // Either re-throw or handle gracefully
  throw new Error('Detailed error message');
}

// Error boundaries for React components
```

### TypeScript (Not Currently Used)
This project uses JavaScript (.jsx/.js) files. Do not add TypeScript unless explicitly requested.

## Linting Rules
- ESLint config in `frontend/eslint.config.js`
- Extends: `js.configs.recommended`, `reactHooks.configs.flat.recommended`, `reactRefresh.configs.vite`
- Custom rule: `no-unused-vars` allows uppercase pattern (e.g., `UPPER_CASE`)
- Always run `bun run lint` before committing
- Use `bun run lint -- --fix` for auto-fixing

## Git Workflow
- Never commit secrets (.env files, API keys)
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `test:`, `chore:`
- Follow existing commit message style from `git log`
- Test on both light and dark modes before submitting PRs

## Architecture Notes
- **Speech Recognition**: Azure Speech SDK via CDN, singleton service in `services/azureSpeech.js`
- **Routing**: React Router v7 with routes: `/`, `/practice`, `/settings`
- **State**: Zustand stores for pronunciation, settings, loading states
- **Storage**: LocalStorage for persistence
- **PWA**: Service worker auto-registration via vite-plugin-pwa

## Mobile Optimization
- All UI must be mobile-first and responsive
- Test viewport: 375px width (iPhone SE) minimum
- Touch-friendly tap targets (min 44x44px)
- PWA installable on iOS/Android

## Development Notes
- Microphone access requires HTTPS or localhost
- Azure Speech API key and region stored in Settings (LocalStorage)
- Dark mode toggle in Settings
- Splash screen fades out after initial load
