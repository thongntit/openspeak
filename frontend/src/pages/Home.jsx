import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Sun,
  Moon,
  ArrowRight,
  Volume2,
  ChevronRight,
  Headphones,
  Layers,
  Sparkles,
  Bookmark,
  Flame,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useThemeStore } from '@/stores/themeStore';
import { getWordsByDifficulty } from '@/services/wordService';
import { getWords } from '@/services/openspeakApi';
import { toShortLevel } from '@/lib/levels';
import { cn } from '@/lib/cn';

// TODO: backend — GET /me/streak should return { days, today, target, last7 }.
const STREAK = { days: 7, today: 12, target: 16, last7: [1, 1, 1, 1, 1, 1, 1, 0] };

const MODES = [
  {
    key: 'shadowing',
    title: 'Shadowing',
    desc: 'Listen, then repeat',
    Icon: Headphones,
    soon: true,
  },
  {
    key: 'minimal-pairs',
    title: 'Minimal pairs',
    desc: 'Isolate tricky sounds',
    Icon: Layers,
    soon: true,
  },
  {
    key: 'ai-coach',
    title: 'AI Coach',
    desc: 'Conversation',
    Icon: Sparkles,
    soon: true,
    badge: 'New',
  },
  {
    key: 'my-words',
    title: 'My words',
    desc: 'Saved for later',
    Icon: Bookmark,
    soon: true,
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useThemeStore();
  const [featuredWords, setFeaturedWords] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function loadFeaturedWords() {
      try {
        const [beg, intm, adv] = await Promise.all([
          getWordsByDifficulty('beginner', 1),
          getWordsByDifficulty('intermediate', 1),
          getWordsByDifficulty('advanced', 1),
        ]);
        let words = [
          beg[0] && { word: beg[0].word, ipa: beg[0].ipa, level: 'beg' },
          intm[0] && { word: intm[0].word, ipa: intm[0].ipa, level: 'int' },
          adv[0] && { word: adv[0].word, ipa: adv[0].ipa, level: 'adv' },
        ].filter(Boolean);
        // Fallback when difficulty isn't tagged in the DB yet.
        if (words.length === 0) {
          const res = await getWords({ limit: 3 });
          words = (res.data ?? []).map((w) => ({
            word: w.word,
            ipa: w.ipa,
            level: toShortLevel(w.difficulty) ?? 'beg',
          }));
        }
        if (!cancelled) setFeaturedWords(words);
      } catch {
        // Silently no-op if API unavailable.
      }
    }
    loadFeaturedWords();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="animate-screen-fade-in">
      <header className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 text-[22px] font-extrabold tracking-tight text-[var(--text-1)]">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-[9px] bg-gradient-to-br from-[#137fec] to-[#0a5fb5] text-white text-sm font-extrabold shadow-[0_2px_6px_rgba(19,127,236,0.35)]">
            P
          </span>
          <span>Pronounce</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-1)] hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-1)] hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
          >
            <Bell size={18} />
          </button>
        </div>
      </header>

      <section className="relative mx-4 mt-1 mb-3.5 flex items-center gap-3.5 overflow-hidden rounded-[18px] bg-gradient-to-br from-[#137fec] to-[#0a5fb5] px-4 py-3.5 text-white">
        <span className="pointer-events-none absolute -top-8 -right-8 h-[140px] w-[140px] rounded-full bg-white/10" />
        <span className="pointer-events-none absolute right-8 -bottom-12 h-[100px] w-[100px] rounded-full bg-white/[0.06]" />
        <div className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/[0.18]">
          <Flame size={22} />
        </div>
        <div className="relative z-10 flex-1 min-w-0">
          <div className="text-[22px] font-extrabold leading-[1.1] tracking-tight">
            {STREAK.days}-day streak
          </div>
          <div className="text-[13px] opacity-85 mt-0.5">
            {STREAK.today} words today · {Math.max(STREAK.target - STREAK.today, 0)} left to go
          </div>
        </div>
        <div className="relative z-10 flex gap-1">
          {STREAK.last7.map((on, i) => (
            <div
              key={i}
              className={cn(
                'w-1.5 h-[22px] rounded-[3px]',
                on ? 'bg-white/95' : 'bg-white/25',
              )}
            />
          ))}
        </div>
      </section>

      <div className="px-4 mb-[22px]">
        <button
          type="button"
          onClick={() => navigate('/practice')}
          className="flex w-full items-center justify-between rounded-[18px] bg-[var(--primary-hex)] px-[22px] py-0 text-white shadow-[0_8px_24px_rgba(19,127,236,0.35)] hover:bg-[#1175d8] active:scale-[0.99] transition-all h-16"
        >
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-base font-bold">Start practice</span>
            <span className="text-xs font-medium opacity-85">
              Random word from your library
            </span>
          </div>
          <span className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-white/20">
            <ArrowRight size={18} />
          </span>
        </button>
      </div>

      {featuredWords.length > 0 && (
        <>
          <h2 className="px-5 mb-2.5 text-[12px] font-bold uppercase tracking-eyebrow text-[var(--text-2)]">
            Try these words
          </h2>
          <div className="px-4 mb-6">
            <Card>
            {featuredWords.map((w, i) => (
              <button
                key={w.word}
                type="button"
                onClick={() => navigate('/practice', { state: { word: w.word } })}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors',
                  'active:bg-black/[0.02] dark:active:bg-white/[0.03]',
                  i < featuredWords.length - 1 && 'border-b border-[var(--border-soft)]',
                )}
              >
                <span className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(19,127,236,0.10)] text-[var(--primary-hex)]">
                  <Volume2 size={20} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-base font-bold tracking-snug text-[var(--text-1)]">
                    {w.word}
                  </span>
                  {w.ipa && (
                    <span className="block font-mono text-xs text-[var(--text-2)] mt-0.5">
                      {w.ipa}
                    </span>
                  )}
                </span>
                <Badge level={toShortLevel(w.level)} />
                <ChevronRight size={16} className="text-[var(--text-2)]" />
              </button>
            ))}
            </Card>
          </div>
        </>
      )}

      <h2 className="px-5 mb-2.5 text-[12px] font-bold uppercase tracking-eyebrow text-[var(--text-2)]">
        Modes
      </h2>
      <div className="px-4 mb-6 grid grid-cols-2 gap-2.5">
        {MODES.map((m) => (
          <Card
            key={m.key}
            className="relative p-3.5 cursor-pointer hover:border-[rgba(19,127,236,0.25)] transition-colors"
            role="button"
            tabIndex={0}
          >
            <span className="mb-2.5 inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-[rgba(19,127,236,0.10)] text-[var(--primary-hex)]">
              <m.Icon size={20} />
            </span>
            <div className="text-sm font-bold tracking-snug text-[var(--text-1)]">
              {m.title}
            </div>
            <div className="text-xs text-[var(--text-2)] mt-0.5">
              {m.soon ? 'Coming soon' : m.desc}
            </div>
            {m.badge && (
              <span className="absolute top-2.5 right-2.5 rounded-full bg-[var(--primary-hex)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                {m.badge}
              </span>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
