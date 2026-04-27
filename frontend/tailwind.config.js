/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: 'var(--primary-hex)',
          foreground: 'hsl(var(--primary-foreground))',
        },
        'bg-app': 'var(--bg-app)',
        'bg-card': 'var(--bg-card)',
        'border-soft': 'var(--border-soft)',
        'text-1': 'var(--text-1)',
        'text-2': 'var(--text-2)',
        success: '#078838',
        warning: '#b45309',
        danger: '#be123c',
        'background-light': '#f6f7f8',
        'background-dark': '#101922',
      },
      borderRadius: {
        card: '16px',
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.03em',
        tight: '-0.02em',
        snug: '-0.01em',
        eyebrow: '0.06em',
      },
      keyframes: {
        'screen-fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'mic-pulse': {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      animation: {
        'screen-fade-in': 'screen-fade-in 240ms ease',
        'mic-pulse': 'mic-pulse 1.6s ease-out infinite',
      },
    },
  },
  plugins: [],
}
