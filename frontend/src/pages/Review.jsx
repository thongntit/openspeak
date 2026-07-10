import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Bookmark, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import TypeChip from '@/components/ui/TypeChip';
import { CARDS, SRS_BUTTONS } from '@/data/srsData';
import { selectDueCardIds, useReviewStore } from '@/stores/reviewStore';

export default function Review() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const reviewByCardId = useReviewStore((store) => store.reviewByCardId);
  const rateCard = useReviewStore((store) => store.rateCard);
  const [queue] = useState(() => {
    const fallbackIds = selectDueCardIds({ reviewByCardId });
    const queueIds = state?.queueIds?.length
      ? state.queueIds
      : state?.queue?.length
        ? state.queue.map((card) => card.id)
        : fallbackIds;
    const cardsById = new Map(CARDS.map((card) => [card.id, card]));
    return queueIds.map((id) => cardsById.get(id)).filter(Boolean);
  });
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState(null);
  const [counts, setCounts] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [finished, setFinished] = useState(false);

  const total = queue.length;
  const card = queue[idx];
  const progressPct = Math.min(100, Math.round((idx / Math.max(1, total)) * 100));

  const onExit = () => navigate('/');

  if (!card || finished) {
    return <ReviewDone counts={counts} total={total} onExit={onExit} />;
  }

  const hasMCQ = Array.isArray(card.options);

  const reveal = () => setRevealed(true);

  const rate = (id) => {
    rateCard(card.id, id);
    setCounts((c) => ({ ...c, [id]: c[id] + 1 }));
    if (idx + 1 >= total) {
      setFinished(true);
    } else {
      setIdx(idx + 1);
      setRevealed(false);
      setPicked(null);
    }
  };

  const pick = (opt) => {
    if (picked) return;
    setPicked(opt);
    setTimeout(() => setRevealed(true), 350);
  };

  return (
    <div className="flex flex-col h-full animate-screen-fade-in">
      {/* Header with progress */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0">
        <button
          type="button"
          onClick={onExit}
          aria-label="Exit review"
          className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-1)]"
        >
          <X size={18} strokeWidth={2} />
        </button>
        <div className="flex-1 h-1.5 rounded-full bg-[var(--border-soft)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--primary-hex)] transition-[width] duration-500"
            style={{ width: progressPct + '%' }}
          />
        </div>
        <div className="font-mono text-[12px] font-semibold text-[var(--text-2)] min-w-[36px] text-right">
          {idx + 1}/{total}
        </div>
      </div>

      {/* Flashcard area */}
      <div className="flex-1 px-4 pb-3 min-h-0">
        <div className="relative w-full h-full">
          {/* Stack bg layers */}
          <div
            className="absolute left-0 right-0 rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-soft)] pointer-events-none"
            style={{ top: 16, bottom: -16, transform: 'scale(0.92)', opacity: 0.35 }}
          />
          <div
            className="absolute left-0 right-0 rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-soft)] pointer-events-none"
            style={{ top: 8, bottom: -8, transform: 'scale(0.96)', opacity: 0.6 }}
          />

          {/* Active card */}
          <div
            key={card.id}
            className="relative w-full h-full overflow-y-auto rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-soft)] p-7 flex flex-col shadow-[0_6px_20px_rgba(15,22,32,0.04)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.3)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <TypeChip type={card.type} />
              <button
                type="button"
                aria-label="Bookmark"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-2)]"
              >
                <Bookmark size={15} strokeWidth={1.8} />
              </button>
            </div>

            <div className="text-[30px] font-bold tracking-tight leading-[1.2] text-center whitespace-pre-wrap text-[var(--text-1)]">
              {card.front}
            </div>

            {card.pos && (
              <div className="font-mono text-[13px] text-[var(--text-2)] text-center mt-2">
                {card.pos}{card.ipa ? ` · ${card.ipa}` : ''}
              </div>
            )}

            {hasMCQ && (
              <div className="flex flex-col gap-2 mt-4">
                {card.options.map((opt, i) => {
                  const correct = revealed && opt === card.answer;
                  const wrong = revealed && picked === opt && opt !== card.answer;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={!!picked}
                      onClick={() => pick(opt)}
                      className={cn(
                        'flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-[15px] font-medium text-left transition-all',
                        'bg-[var(--bg-app)] border border-[var(--border-soft)]',
                        !picked && 'hover:border-[var(--primary-hex)]',
                        correct && 'bg-[rgba(7,136,56,.08)] border-[rgba(7,136,56,.4)] text-[#078838]',
                        wrong && 'bg-[rgba(190,18,60,.08)] border-[rgba(190,18,60,.4)] text-[#be123c]',
                        picked && !correct && !wrong && 'opacity-60',
                      )}
                    >
                      <span className={cn(
                        'inline-flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-md',
                        'bg-[var(--bg-card)] border border-[var(--border-soft)]',
                        'font-mono text-[11px] font-bold',
                      )}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {correct && <Check size={16} strokeWidth={2.5} className="ml-auto flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Back reveal */}
            {revealed && (
              <div className="mt-5 pt-4 border-t border-[var(--border-soft)] animate-screen-fade-in">
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-2)] mb-2">
                  Answer
                </div>
                <div className="text-[17px] font-semibold leading-[1.4] tracking-snug text-[var(--text-1)]">
                  {card.back}
                </div>
                {card.example && (
                  <div className="mt-3.5 p-3 rounded-xl bg-[var(--bg-app)] text-[13px] text-[var(--text-2)] leading-relaxed whitespace-pre-wrap italic">
                    {card.example}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-6 flex-shrink-0">
        {!revealed ? (
          <button
            type="button"
            onClick={reveal}
            className="w-full h-[52px] rounded-xl bg-[var(--primary-hex)] text-white font-semibold text-[15px] active:scale-[0.98] transition-transform"
          >
            Show answer
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {SRS_BUTTONS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => rate(b.id)}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-[14px]',
                  'bg-[var(--bg-card)] border transition-transform active:scale-[0.96]',
                  b.id === 'again' && 'border-[rgba(190,18,60,.3)] text-[#be123c]',
                  b.id === 'hard' && 'border-[rgba(180,83,9,.3)] text-[#b45309]',
                  b.id === 'good' && 'border-[rgba(7,136,56,.3)] text-[#078838]',
                  b.id === 'easy' && 'border-[rgba(19,127,236,.3)] text-[var(--primary-hex)]',
                )}
              >
                <span className="text-[13px] font-bold tracking-snug">{b.label}</span>
                <span className="font-mono text-[11px] opacity-65">{b.interval}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewDone({ counts, total, onExit }) {
  const correct = counts.good + counts.easy;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center px-6 py-16 text-center animate-screen-fade-in">
      <div
        className="inline-flex h-[88px] w-[88px] items-center justify-center rounded-full mb-4"
        style={{ background: 'rgba(7,136,56,.10)', color: '#078838' }}
      >
        <Check size={42} strokeWidth={2} />
      </div>
      <div className="text-[26px] font-extrabold tracking-tight text-[var(--text-1)]">
        Session complete
      </div>
      <div className="text-[14px] text-[var(--text-2)] mt-1.5 mb-6">
        You reviewed {total} cards · {accuracy}% remembered well
      </div>

      <div className="w-full grid grid-cols-4 gap-2 mb-5">
        {SRS_BUTTONS.map((b) => (
          <div key={b.id} className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-card p-3 text-center">
            <div className="text-[20px] font-extrabold" style={{ color: b.color }}>{counts[b.id]}</div>
            <div className="text-[11px] font-semibold uppercase tracking-eyebrow text-[var(--text-2)] mt-0.5">
              {b.label}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onExit}
        className="w-full h-12 rounded-xl bg-[var(--primary-hex)] text-white font-semibold text-[15px] active:scale-[0.98] transition-transform"
      >
        Back to Today
      </button>
    </div>
  );
}
