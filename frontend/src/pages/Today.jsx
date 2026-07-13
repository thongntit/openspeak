import { useNavigate } from 'react-router-dom';
import {
  Flame, CreditCard, ArrowRight, Languages, BookOpen, Lightbulb, Sparkles,
  Sun, Moon,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import DeckRow from '@/components/DeckRow';
import { useThemeStore } from '@/stores/themeStore';
import { DECKS, totalDue, totalNew, dueByType } from '@/data/srsData';

const STREAK_DAYS = 12;
const STREAK_LAST7 = [1, 1, 1, 1, 1, 1, 0];

const TODAY_LABEL = new Date().toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric',
});

export default function Today() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useThemeStore();

  const due = totalDue();
  const newCount = totalNew();
  const byType = dueByType();
  const dueDecks = DECKS.filter((d) => d.due > 0).slice(0, 4);

  return (
    <div className="animate-screen-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-4 pb-3">
        <div>
          <div className="text-[13px] font-semibold text-[var(--text-2)]">{TODAY_LABEL}</div>
          <div className="text-[24px] font-extrabold tracking-tight text-[var(--text-1)] mt-0.5">
            Today
          </div>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-1)]"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Streak strip */}
      <section
        className="relative mx-4 mb-3.5 flex items-center gap-3.5 overflow-hidden rounded-[18px] bg-gradient-to-br from-[#137fec] to-[#0a5fb5] px-4 py-3.5 text-white"
      >
        <span className="pointer-events-none absolute -top-8 -right-8 h-[140px] w-[140px] rounded-full bg-white/10" />
        <span className="pointer-events-none absolute right-8 -bottom-12 h-[100px] w-[100px] rounded-full bg-white/[0.06]" />
        <div className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/[0.18]">
          <Flame size={22} />
        </div>
        <div className="relative z-10 flex-1 min-w-0">
          <div className="text-[22px] font-extrabold leading-[1.1] tracking-tight">
            {STREAK_DAYS}-day streak
          </div>
          <div className="text-[13px] opacity-85 mt-0.5">
            Keep it up — review {due} cards to extend
          </div>
        </div>
        <div className="relative z-10 flex gap-1">
          {STREAK_LAST7.map((on, i) => (
            <div
              key={i}
              className="w-1.5 rounded-[3px]"
              style={{ height: 22, background: on ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.30)' }}
            />
          ))}
        </div>
      </section>

      {/* Cards due card */}
      <div className="px-4 mb-[18px]">
        <Card className="p-[22px]">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[12px] font-bold uppercase tracking-eyebrow text-[var(--text-2)]">
                Cards due
              </div>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-[56px] font-extrabold tracking-tightest leading-none text-[var(--text-1)]">
                  {due}
                </span>
                <span className="text-[18px] font-bold text-[var(--text-2)]">to review</span>
              </div>
              <div className="text-[13px] text-[var(--text-2)] mt-1.5">
                + {newCount} new cards learning
              </div>
            </div>
            <div
              className="inline-flex h-[60px] w-[60px] items-center justify-center rounded-[18px]"
              style={{ background: 'rgba(19,127,236,.10)', color: 'var(--primary-hex)' }}
            >
              <CreditCard size={28} strokeWidth={1.8} />
            </div>
          </div>

          {/* Type breakdown chips */}
          <div className="flex flex-wrap gap-1.5 mt-3.5 mb-4">
            {byType.vocab > 0 && (
              <TypeChip icon={<Languages size={12} strokeWidth={2} />} label={`${byType.vocab} vocab`} variant="vocab" />
            )}
            {byType.grammar > 0 && (
              <TypeChip icon={<BookOpen size={12} strokeWidth={2} />} label={`${byType.grammar} grammar`} variant="grammar" />
            )}
            {byType.tip > 0 && (
              <TypeChip icon={<Lightbulb size={12} strokeWidth={2} />} label={`${byType.tip} tips`} variant="tip" />
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/review')}
            className="flex w-full h-[52px] items-center justify-between rounded-xl bg-[var(--primary-hex)] px-[18px] text-white font-semibold text-[15px] active:scale-[0.98] transition-transform"
          >
            <span className="flex items-center gap-2.5">
              <CreditCard size={18} strokeWidth={1.8} /> Start review session
            </span>
            <ArrowRight size={18} strokeWidth={2} />
          </button>
        </Card>
      </div>

      {/* Decks with due */}
      <div className="flex items-center justify-between px-5 mb-2.5">
        <span className="text-[12px] font-bold uppercase tracking-eyebrow text-[var(--text-2)]">
          Decks with due cards
        </span>
      </div>
      <div className="px-4 mb-[22px]">
        <Card className="overflow-hidden">
          {dueDecks.map((d) => (
            <DeckRow
              key={d.id}
              deck={d}
              onClick={() => navigate('/library', { state: { openDeckId: d.id } })}
            />
          ))}
        </Card>
      </div>

      {/* Tip of the day */}
      <div className="px-4 pb-4">
        <Card
          className="flex items-center gap-3 p-3.5"
          style={{ background: 'rgba(124,58,237,.05)', borderColor: 'rgba(124,58,237,.20)' }}
        >
          <div
            className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: 'rgba(124,58,237,.12)', color: '#7c3aed' }}
          >
            <Sparkles size={18} strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-bold text-[var(--text-1)]">Tip of the day</div>
            <div className="text-[12px] text-[var(--text-2)] mt-0.5">
              Use <span className="font-bold text-[var(--text-1)]">fewer</span> for things you
              count, <span className="font-bold text-[var(--text-1)]">less</span> for things you can't.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function TypeChip({ icon, label, variant }) {
  const variants = {
    vocab: 'bg-[rgba(19,127,236,.10)] text-[#137fec] dark:bg-[rgba(96,165,250,.15)] dark:text-[#60a5fa]',
    grammar: 'bg-[rgba(124,58,237,.10)] text-[#7c3aed] dark:bg-[rgba(167,139,250,.15)] dark:text-[#a78bfa]',
    tip: 'bg-[rgba(234,88,12,.10)] text-[#ea580c] dark:bg-[rgba(251,146,60,.15)] dark:text-[#fb923c]',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.02em] ${variants[variant]}`}>
      {icon} {label}
    </span>
  );
}
