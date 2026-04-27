import { TrendingUp, ChevronRight } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PhonemeChip from '@/components/ui/PhonemeChip';
import { bandClass } from '@/lib/score';
import { cn } from '@/lib/cn';

// TODO: backend — GET /me/progress?range=week should return weekly bars,
// phoneme heatmap, and recent sessions.
const WEEK = {
  avg: 84,
  delta: 6,
  days: [62, 78, 80, 75, 88, 84, 92],
  labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
};

const HEATMAP = [
  { p: 'θ', s: 48 }, { p: 'ð', s: 62 }, { p: 'ɝː', s: 58 }, { p: 'ʃ', s: 72 },
  { p: 'ʒ', s: 65 }, { p: 'ŋ', s: 88 }, { p: 'r', s: 82 }, { p: 'l', s: 90 },
  { p: 'w', s: 85 }, { p: 'eɪ', s: 78 }, { p: 'oʊ', s: 86 }, { p: 'aɪ', s: 92 },
];

const RECENT = [
  { word: 'Pronunciation', score: 76, when: '2m ago' },
  { word: 'Squirrel', score: 64, when: '5m ago' },
  { word: 'Think', score: 88, when: '8m ago' },
];

export default function Progress() {
  const max = 100;

  return (
    <div className="animate-screen-fade-in">
      <header className="flex items-center justify-between px-5 pt-4 pb-3">
        <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--text-1)]">
          Progress
        </h1>
        <button
          type="button"
          aria-label="Insights"
          className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-1)] hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
        >
          <TrendingUp size={18} />
        </button>
      </header>

      <div className="px-4 mb-4">
        <Card className="p-4">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-eyebrow text-[var(--text-2)]">
                This week
              </div>
              <div className="mt-1 text-[32px] font-extrabold tracking-tighter text-[var(--text-1)]">
                {WEEK.avg}
                <span className="text-lg text-[var(--text-2)] font-bold ml-1">% avg</span>
              </div>
            </div>
            <Badge level="beg" className="text-[11px]">
              <TrendingUp size={11} /> +{WEEK.delta}
            </Badge>
          </div>
          <div className="mt-4 flex items-end gap-1.5 h-[100px]">
            {WEEK.days.map((v, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1.5"
              >
                <div
                  className={cn(
                    'w-full rounded-md transition-[height]',
                    i === WEEK.days.length - 1
                      ? 'bg-[var(--primary-hex)]'
                      : 'bg-[rgba(19,127,236,0.25)]',
                  )}
                  style={{ height: `${(v / max) * 86}px` }}
                />
                <div className="text-[11px] font-semibold text-[var(--text-2)]">
                  {WEEK.labels[i]}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <h2 className="px-5 mb-2.5 text-[12px] font-bold uppercase tracking-eyebrow text-[var(--text-2)]">
        Phoneme heatmap
      </h2>
      <div className="px-4 mb-[18px]">
        <Card className="p-3.5">
          <div className="grid grid-cols-6 gap-1.5">
            {HEATMAP.map((h, i) => (
              <PhonemeChip
                key={i}
                phoneme={h.p}
                score={h.s}
                className="px-0 py-2.5 min-w-0"
              />
            ))}
          </div>
        </Card>
      </div>

      <h2 className="px-5 mb-2.5 text-[12px] font-bold uppercase tracking-eyebrow text-[var(--text-2)]">
        Recent sessions
      </h2>
      <div className="px-4 mb-[18px]">
        <Card className="overflow-hidden">
          {RECENT.map((r, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3.5 px-4 py-3.5 cursor-pointer',
                'active:bg-black/[0.02] dark:active:bg-white/[0.03]',
                i < RECENT.length - 1 && 'border-b border-[var(--border-soft)]',
              )}
            >
              <PhonemeChip
                band={bandClass(r.score)}
                className="px-2 py-1.5 min-w-0 text-xs"
                phoneme={Math.round(r.score)}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-[var(--text-1)] truncate">
                  {r.word}
                </div>
                <div className="text-xs text-[var(--text-2)]">{r.when}</div>
              </div>
              <ChevronRight size={16} className="text-[var(--text-2)]" />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
