import { useCallback, useEffect, useRef, useState } from 'react';
import { telemetry } from '@devvit/analytics/client/reddit';
import type {
  CompleteResponse,
  DailyResponse,
  ErrorResponse,
  GuessResponse,
  InitResponse,
  ShareResponse,
} from '../../shared/api';

export type Reveal = {
  correct: boolean;
  answer: string;
  blurb: string;
  permalink: string;
};

type Phase = 'loading' | 'ready' | 'error';

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const data = (await res.json()) as T & ErrorResponse;
  if (!res.ok || (data as ErrorResponse).status === 'error') {
    throw new Error((data as ErrorResponse).message ?? `HTTP ${res.status}`);
  }
  return data;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T & ErrorResponse;
  if (!res.ok || (data as ErrorResponse).status === 'error') {
    throw new Error((data as ErrorResponse).message ?? `HTTP ${res.status}`);
  }
  return data;
}

export function useGame() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string>('');
  const [init, setInit] = useState<InitResponse | null>(null);
  const [daily, setDaily] = useState<DailyResponse | null>(null);
  const [roundIdx, setRoundIdx] = useState(0);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [guessing, setGuessing] = useState(false);
  const [result, setResult] = useState<CompleteResponse | null>(null);
  const [completing, setCompleting] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'busy' | 'done' | 'failed'>('idle');
  const startedRef = useRef(false);

  useEffect(() => {
    void (async () => {
      try {
        const [initData, dailyData] = await Promise.all([
          getJson<InitResponse>('/api/init'),
          getJson<DailyResponse>('/api/daily'),
        ]);
        setInit(initData);
        setDaily(dailyData);
        // Resume where the player left off (e.g. after a refresh).
        const next = dailyData.rounds.findIndex((r) => !r.answered);
        setRoundIdx(next === -1 ? dailyData.rounds.length : next);
        if (dailyData.done) {
          setCompleting(true);
        }
        setPhase('ready');
        void telemetry.appReady().catch(() => undefined);
        if (!startedRef.current && !dailyData.done) {
          startedRef.current = true;
          void telemetry.startJourney().catch(() => undefined);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
        setPhase('error');
      }
    })();
  }, []);

  // When a returning player already finished today, fetch their result card.
  useEffect(() => {
    if (!completing || result) return;
    void (async () => {
      try {
        setResult(await postJson<CompleteResponse>('/api/complete', {}));
      } catch {
        /* result card is best-effort for a completed day */
      } finally {
        setCompleting(false);
      }
    })();
  }, [completing, result]);

  const guess = useCallback(
    async (choice: string) => {
      if (!daily || guessing || reveal) return;
      setGuessing(true);
      try {
        const g = await postJson<GuessResponse>('/api/guess', { round: roundIdx, choice });
        setReveal({ correct: g.correct, answer: g.answer, blurb: g.blurb, permalink: g.permalink });
        setDaily((prev) =>
          prev
            ? {
                ...prev,
                rounds: prev.rounds.map((r, i) =>
                  i === roundIdx ? { ...r, answered: true, answeredCorrect: g.correct } : r
                ),
                score: prev.score + (g.correct ? 1 : 0),
              }
            : prev
        );
        void telemetry
          .progress({
            progress: (roundIdx + 1) / daily.rounds.length,
            action: 'round_answered',
            actionDetails: g.correct ? 'correct' : 'wrong',
          })
          .catch(() => undefined);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not record your guess.');
      } finally {
        setGuessing(false);
      }
    },
    [daily, guessing, reveal, roundIdx]
  );

  const next = useCallback(() => {
    if (!daily) return;
    const last = roundIdx >= daily.rounds.length - 1;
    setReveal(null);
    if (last) {
      setCompleting(true);
      void telemetry
        .endJourney({ complete: true, game: { win: daily.score >= 2, score: daily.score } })
        .catch(() => undefined);
    } else {
      setRoundIdx((i) => i + 1);
    }
  }, [daily, roundIdx]);

  const share = useCallback(async () => {
    if (shareState === 'busy' || shareState === 'done') return;
    setShareState('busy');
    try {
      await postJson<ShareResponse>('/api/share', {});
      setShareState('done');
      void telemetry.interaction({ action: 'score_shared' }).catch(() => undefined);
    } catch {
      setShareState('failed');
    }
  }, [shareState]);

  return {
    phase,
    error,
    init,
    daily,
    roundIdx,
    reveal,
    guessing,
    result,
    completing,
    shareState,
    guess,
    next,
    share,
  } as const;
}
