import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  HelpCircle,
  Volume2,
  Bookmark,
  RotateCcw,
  ArrowRight,
  Mic,
  X,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PhonemeChip from '@/components/ui/PhonemeChip';
import { usePronunciationStore } from '@/stores/pronunciationStore';
import azureSpeech from '@/services/azureSpeech';
import { getRandomWord, searchWords } from '@/services/wordService';
import { bandClass, bandLabel, bandColor } from '@/lib/score';
import { cn } from '@/lib/cn';

// Dev-only: initialize Azure SDK from env vars if present. In production the
// token + region come from a backend endpoint (separate work item).
const AZURE_KEY = import.meta.env.VITE_AZURE_SPEECH_KEY;
const AZURE_REGION = import.meta.env.VITE_AZURE_SPEECH_REGION;
let azureReady = false;
function ensureAzure() {
  if (azureReady) return true;
  if (!AZURE_KEY || !AZURE_REGION) return false;
  try {
    azureSpeech.initialize(AZURE_KEY, AZURE_REGION);
    azureReady = true;
    return true;
  } catch {
    return false;
  }
}

function parseAzureResult(result) {
  try {
    const json = JSON.parse(result.json);
    const nbest = json?.NBest?.[0];
    const accuracy = Math.round(nbest?.PronunciationAssessment?.AccuracyScore ?? 0);
    const phonemes = (nbest?.Words ?? []).flatMap((w) =>
      (w.Phonemes ?? []).map((p) => ({
        p: p.Phoneme,
        s: p.PronunciationAssessment?.AccuracyScore ?? 0,
      })),
    );
    return { accuracy, phonemes };
  } catch {
    return { accuracy: null, phonemes: [] };
  }
}

function speakWord(word) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(word);
  utter.lang = 'en-US';
  utter.rate = 0.95;
  window.speechSynthesis.speak(utter);
}

function ScoreRing({ score }) {
  const [animScore, setAnimScore] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimScore(score));
    return () => cancelAnimationFrame(id);
  }, [score]);

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - animScore / 100);
  const color = bandColor(score);
  const band = bandClass(score);
  const colorClass =
    band === 'good'
      ? 'text-[#078838] dark:text-[#4ade80]'
      : band === 'mid'
        ? 'text-[#b45309] dark:text-[#fbbf24]'
        : 'text-[#be123c] dark:text-[#fb7185]';

  return (
    <div className="text-center">
      <div className="relative inline-flex h-[132px] w-[132px] items-center justify-center">
        <svg width="132" height="132" className="-rotate-90">
          <circle cx="66" cy="66" r={radius} stroke="var(--border-soft)" strokeWidth="8" fill="none" />
          <circle
            cx="66"
            cy="66"
            r={radius}
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)' }}
          />
        </svg>
        <div
          className={cn(
            'absolute text-4xl font-extrabold tracking-tighter leading-none',
            colorClass,
          )}
        >
          {score}
          <span className="text-base">%</span>
        </div>
      </div>
      <div className="mt-2 text-sm font-semibold text-[var(--text-2)]">{bandLabel(score)}</div>
    </div>
  );
}

function Waveform({ bars }) {
  return (
    <div className="flex h-14 items-center justify-center gap-[3px]">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-sm bg-[var(--primary-hex)] transition-[height] duration-100"
          style={{ height: h }}
        />
      ))}
    </div>
  );
}

function MicButton({ recording, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={recording ? 'Stop recording' : 'Start recording'}
      className={cn(
        'relative inline-flex h-[88px] w-[88px] items-center justify-center rounded-full border-none text-white cursor-pointer transition-all',
        'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        recording
          ? 'bg-[#e11d48] shadow-[0_8px_24px_rgba(225,29,72,0.45)]'
          : 'bg-[var(--primary-hex)] shadow-[0_8px_24px_rgba(19,127,236,0.4)]',
      )}
    >
      {recording && (
        <>
          <span className="pointer-events-none absolute -inset-1 rounded-full border-[3px] border-[rgba(225,29,72,0.5)] animate-mic-pulse" />
          <span
            className="pointer-events-none absolute -inset-1 rounded-full border-[3px] border-[rgba(225,29,72,0.5)] animate-mic-pulse"
            style={{ animationDelay: '0.8s' }}
          />
        </>
      )}
      {recording ? (
        <span className="h-6 w-6 rounded-[5px] bg-white" />
      ) : (
        <Mic size={34} fill="currentColor" />
      )}
    </button>
  );
}

function SideButton({ onClick, disabled, ariaLabel, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex h-14 w-14 items-center justify-center rounded-[18px]',
        'bg-[var(--bg-card)] border border-[var(--border-soft)] text-[var(--text-1)]',
        'transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed',
      )}
    >
      {children}
    </button>
  );
}

export default function Practice() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, result, error, setState, setResult, setError, reset } =
    usePronunciationStore();
  const [wordData, setWordData] = useState(null);
  const [isLoadingWord, setIsLoadingWord] = useState(false);
  const [animatedBars, setAnimatedBars] = useState(Array(28).fill(6));
  const [recordTime, setRecordTime] = useState(0);
  const [toast, setToast] = useState(null);
  const animRef = useRef(null);
  const timerRef = useRef(null);
  const toastTimerRef = useRef(null);

  const bars = state === 'recording' ? animatedBars : Array(28).fill(6);

  const loadRandomWord = useCallback(async () => {
    setIsLoadingWord(true);
    try {
      const word = await getRandomWord();
      if (!word) throw new Error('No words available');
      setWordData({ word: word.word, ipa: word.ipa, level: word.difficulty });
      reset();
    } catch (err) {
      setError('Failed to load word: ' + err.message);
    } finally {
      setIsLoadingWord(false);
    }
  }, [reset, setError]);

  const loadWordByText = useCallback(
    async (text) => {
      setIsLoadingWord(true);
      try {
        const results = await searchWords(text, 1);
        const word = results[0];
        if (!word) throw new Error(`Word "${text}" not found`);
        setWordData({ word: word.word, ipa: word.ipa, level: word.difficulty });
        reset();
      } catch (err) {
        setError('Failed to load word: ' + err.message);
      } finally {
        setIsLoadingWord(false);
      }
    },
    [reset, setError],
  );

  useEffect(() => {
    let cancelled = false;
    const fromState = location.state?.word;
    setIsLoadingWord(true);
    (async () => {
      try {
        const word = fromState
          ? (await searchWords(fromState, 1))[0]
          : await getRandomWord();
        if (cancelled) return;
        if (!word) throw new Error(fromState ? `Word "${fromState}" not found` : 'No words available');
        setWordData({ word: word.word, ipa: word.ipa, level: word.difficulty });
        reset();
      } catch (err) {
        if (!cancelled) setError('Failed to load word: ' + err.message);
      } finally {
        if (!cancelled) setIsLoadingWord(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.state?.word, reset, setError]);

  useEffect(() => {
    if (state !== 'recording') return undefined;
    const tick = () => {
      setAnimatedBars((prev) =>
        prev.map((_, i) => {
          const t = Date.now() / 200 + i * 0.6;
          return 8 + Math.abs(Math.sin(t)) * 32 + Math.random() * 12;
        }),
      );
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    timerRef.current = setInterval(() => setRecordTime((t) => t + 0.1), 100);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  const parsed = result ? parseAzureResult(result) : null;
  const accuracy = parsed?.accuracy ?? null;
  const phonemes = parsed?.phonemes ?? [];

  const showToastForScore = useCallback((score) => {
    if (score == null) return;
    const message =
      score >= 80
        ? '🎯 Great pronunciation!'
        : score >= 60
          ? 'Good try — keep going'
          : 'Try again, focus on the highlighted sounds';
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  const handleStartRecording = async () => {
    if (!ensureAzure()) {
      setError('Speech recognition is not configured. Backend token endpoint is pending.');
      return;
    }
    setError(null);
    setRecordTime(0);
    setState('recording');
    try {
      await azureSpeech.assessPronunciation(
        wordData.word,
        (azureResult) => {
          setResult(azureResult);
          const { accuracy: a } = parseAzureResult(azureResult);
          showToastForScore(a);
        },
        (err) => {
          setError(err);
          setState('idle');
        },
      );
    } catch (err) {
      setError('Failed to start recording: ' + err.message);
      setState('idle');
    }
  };

  const handleStopRecording = () => {
    setState('assessing');
    azureSpeech.stopRecognition();
  };

  const handleMic = () => {
    if (isLoadingWord || !wordData) return;
    if (state === 'recording') {
      handleStopRecording();
    } else if (state === 'idle' || state === 'result') {
      handleStartRecording();
    }
  };

  const handleRetry = () => {
    if (state === 'recording') azureSpeech.stopRecognition();
    setRecordTime(0);
    reset();
  };

  const handleNext = () => {
    if (state === 'recording' || state === 'assessing') return;
    loadRandomWord();
  };

  const levelCode = wordData?.level
    ? wordData.level === 'beginner'
      ? 'beg'
      : wordData.level === 'intermediate'
        ? 'int'
        : 'adv'
    : null;

  return (
    <>
    <div className="animate-screen-fade-in pb-44 relative">
      <header className="flex items-center justify-between px-5 pt-4 pb-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="Back"
          className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-1)] hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-[13px] font-semibold text-[var(--text-2)]">Practice</div>
        <button
          type="button"
          aria-label="Help"
          className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-1)] hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
        >
          <HelpCircle size={18} />
        </button>
      </header>

      {error && (
        <div className="mx-4 mb-3 rounded-xl border border-[rgba(190,18,60,0.25)] bg-[rgba(190,18,60,0.08)] px-3 py-2.5 text-sm text-[#be123c] flex items-start gap-2">
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            className="text-[#be123c] hover:opacity-70"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section className="px-5 pt-5 pb-2 text-center">
        {levelCode && (
          <div className="mb-3.5 flex justify-center">
            <Badge level={levelCode} />
          </div>
        )}
        <h1 className="text-[52px] font-extrabold leading-none tracking-tighter text-[var(--text-1)]">
          {isLoadingWord || !wordData ? (
            <span className="text-[var(--text-2)] text-3xl">Loading…</span>
          ) : (
            wordData.word
          )}
        </h1>
        <div className="mt-2.5 font-mono text-[17px] text-[var(--text-2)]">
          {wordData?.ipa || ' '}
        </div>
        <div className="mt-4 flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => wordData && speakWord(wordData.word)}
            disabled={!wordData || isLoadingWord}
          >
            <Volume2 size={16} /> Hear it
          </Button>
          <Button variant="outline" size="sm" disabled={!wordData}>
            <Bookmark size={16} /> Save
          </Button>
        </div>
      </section>

      <section className="px-5 pt-6 flex justify-center min-h-[180px]">
        {state === 'idle' && (
          <div className="text-center text-[var(--text-2)]">
            <div className="inline-flex h-[132px] w-[132px] flex-col items-center justify-center gap-1 rounded-full border-2 border-dashed border-[var(--border-soft)]">
              <div className="text-[28px] font-extrabold text-[var(--text-2)]">—</div>
              <div className="text-[10px] font-bold tracking-[0.1em]">SCORE</div>
            </div>
            <div className="mt-3.5 text-[13px]">Tap the mic and say the word</div>
          </div>
        )}

        {state === 'recording' && (
          <div className="w-full text-center">
            <Waveform bars={bars} />
            <div className="mt-4 font-mono text-[28px] font-bold tracking-[0.05em] text-[#e11d48]">
              {recordTime.toFixed(1)}s
            </div>
            <div className="mt-1 text-xs text-[var(--text-2)]">
              Listening… tap mic to stop
            </div>
          </div>
        )}

        {state === 'assessing' && (
          <div className="text-center">
            <div className="inline-flex h-[132px] w-[132px] items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--bg-card)]">
              <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[var(--border-soft)] border-t-[var(--primary-hex)]" />
            </div>
            <div className="mt-3.5 text-[13px] text-[var(--text-2)]">
              Analyzing pronunciation…
            </div>
          </div>
        )}

        {state === 'result' && accuracy != null && <ScoreRing score={accuracy} />}
      </section>

      {state === 'result' && phonemes.length > 0 && (
        <section className="px-5 pt-5">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-[12px] font-bold uppercase tracking-eyebrow text-[var(--text-2)]">
              Phoneme breakdown
            </h2>
            <span className="text-[11px] text-[var(--text-2)]">tap to hear</span>
          </div>
          <Card className="p-3.5">
            <div className="flex flex-wrap justify-center gap-1.5">
              {phonemes.map((p, i) => (
                <PhonemeChip
                  key={i}
                  phoneme={p.p}
                  score={p.s}
                  className="px-2.5 py-2 min-w-[38px]"
                />
              ))}
            </div>
            <div className="mt-3 flex justify-center gap-3.5 border-t border-[var(--border-soft)] pt-3 text-xs text-[var(--text-2)]">
              <LegendDot color="#078838" label="≥80" />
              <LegendDot color="#b45309" label="60–79" />
              <LegendDot color="#be123c" label="<60" />
            </div>
          </Card>
        </section>
      )}
    </div>

      <div className="fixed bottom-[92px] left-1/2 -translate-x-1/2 w-full max-w-md flex items-center justify-center gap-7 px-6 pointer-events-none">
        <div className="pointer-events-auto">
          <SideButton
            onClick={handleRetry}
            disabled={state === 'idle' || state === 'recording'}
            ariaLabel="Retry"
          >
            <RotateCcw size={20} />
          </SideButton>
        </div>
        <div className="pointer-events-auto">
          <MicButton
            recording={state === 'recording'}
            onClick={handleMic}
            disabled={state === 'assessing' || isLoadingWord || !wordData}
          />
        </div>
        <div className="pointer-events-auto">
          <SideButton
            onClick={handleNext}
            disabled={state === 'recording' || state === 'assessing' || isLoadingWord}
            ariaLabel="Next word"
          >
            <ArrowRight size={20} />
          </SideButton>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-[200px] left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40">
          <div className="flex items-center gap-2.5 rounded-xl bg-[rgba(15,22,32,0.92)] px-3.5 py-3 text-sm font-medium text-white backdrop-blur-md">
            <span className="flex-1">{toast}</span>
          </div>
        </div>
      )}
    </>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
