import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { navigateTo } from '@devvit/web/client';
import { useGame } from './hooks/useGame';

const Magnifier = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={className} aria-hidden="true">
    <circle cx="10.5" cy="10.5" r="6.5" />
    <line x1="15.5" y1="15.5" x2="21" y2="21" strokeLinecap="round" />
  </svg>
);

const App = () => {
  const {
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
  } = useGame();

  const round = daily && roundIdx < daily.rounds.length ? daily.rounds[roundIdx] : undefined;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-slate-950 via-[#101b31] to-slate-950 px-4 py-8 text-amber-50">
      {phase === 'loading' && (
        <div className="flex flex-col items-center gap-3 text-amber-100/70">
          <Magnifier className="w-10 h-10 animate-pulse" />
          <p>Opening today's case file…</p>
        </div>
      )}

      {phase === 'error' && (
        <div className="max-w-md rounded-xl bg-red-500/10 p-5 text-center">
          <p className="font-semibold text-red-300">The case file jammed.</p>
          <p className="mt-1 text-sm text-red-200/80">{error}</p>
          <button
            onClick={() => location.reload()}
            className="mt-4 rounded-full bg-amber-400 px-5 py-2 font-bold text-slate-950"
          >
            Retry
          </button>
        </div>
      )}

      {phase === 'ready' && daily && !result && !completing && round && (
        <div className="flex w-full max-w-md flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300">
              <Magnifier className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-widest">
                Case {roundIdx + 1} of {daily.rounds.length}
              </span>
            </div>
            <div className="flex gap-1.5" aria-label="progress">
              {daily.rounds.map((r, i) => (
                <span
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full ${
                    !r.answered
                      ? i === roundIdx
                        ? 'bg-amber-300'
                        : 'bg-white/15'
                      : r.answeredCorrect
                        ? 'bg-emerald-400'
                        : 'bg-red-400'
                  }`}
                />
              ))}
            </div>
          </div>

          <article className="rounded-2xl border border-amber-200/10 bg-white/5 p-5 shadow-xl">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-100/50">
              Evidence — a real post from somewhere on Reddit
            </div>
            <h1 className="text-xl font-bold leading-snug">“{round.title}”</h1>
            {round.excerpt && (
              <p className="mt-2 line-clamp-3 text-sm text-amber-50/70">{round.excerpt}…</p>
            )}
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-400/10 p-3 text-sm text-amber-200">
              <span aria-hidden="true">🔎</span>
              <span>{round.hint}</span>
            </div>
          </article>

          {!reveal ? (
            <div className="flex flex-col gap-2.5">
              <div className="text-center text-xs font-semibold uppercase tracking-wide text-amber-100/50">
                Where does this post live?
              </div>
              {round.choices.map((choice) => (
                <button
                  key={choice}
                  onClick={() => guess(choice)}
                  disabled={guessing}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-left font-semibold transition-all hover:border-amber-300/60 hover:bg-amber-400/10 disabled:opacity-50"
                >
                  r/{choice}
                </button>
              ))}
            </div>
          ) : (
            <div
              className={`flex flex-col gap-3 rounded-2xl border p-5 ${
                reveal.correct
                  ? 'border-emerald-400/40 bg-emerald-500/10'
                  : 'border-red-400/40 bg-red-500/10'
              }`}
            >
              <div className="text-lg font-bold">
                {reveal.correct ? '✅ Case cracked!' : '❌ Not quite.'}
              </div>
              <p>
                It was{' '}
                <button
                  onClick={() => navigateTo(reveal.permalink)}
                  className="font-bold text-amber-300 underline"
                >
                  r/{reveal.answer}
                </button>
                <span className="text-amber-50/80"> — {reveal.blurb}</span>
              </p>
              <button
                onClick={next}
                className="mt-1 rounded-full bg-amber-400 px-5 py-3 font-bold text-slate-950 transition-colors hover:bg-amber-300"
              >
                {roundIdx >= daily.rounds.length - 1 ? 'See my report' : 'Next case'}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'ready' && (result || completing) && (
        <div className="flex w-full max-w-md flex-col items-center gap-5">
          {!result ? (
            <div className="flex flex-col items-center gap-3 text-amber-100/70">
              <Magnifier className="w-8 h-8 animate-pulse" />
              <p>Filing your report…</p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <div className="text-6xl font-black text-amber-300">{result.score}/3</div>
                <p className="mt-2 text-lg font-semibold text-amber-100">
                  {result.score === 3
                    ? 'Master Sleuth. Flawless.'
                    : result.score === 2
                      ? 'Sharp instincts, detective.'
                      : result.score === 1
                        ? 'A lead or two slipped away.'
                        : 'The trail went cold today.'}
                </p>
              </div>

              <div className="flex gap-3">
                <div className="rounded-xl bg-white/5 px-4 py-3 text-center">
                  <div className="text-2xl font-bold text-orange-400">🔥 {result.streak}</div>
                  <div className="text-xs uppercase tracking-wide text-amber-100/60">day streak</div>
                </div>
                <div className="rounded-xl bg-white/5 px-4 py-3 text-center">
                  <div className="text-2xl font-bold text-amber-200">{result.best}/3</div>
                  <div className="text-xs uppercase tracking-wide text-amber-100/60">best</div>
                </div>
                <div className="rounded-xl bg-white/5 px-4 py-3 text-center">
                  <div className="text-2xl font-bold text-amber-200">
                    {result.rank ? `#${result.rank}` : '—'}
                  </div>
                  <div className="text-xs uppercase tracking-wide text-amber-100/60">today</div>
                </div>
              </div>

              {result.leaderboard.length > 0 && (
                <div className="w-full rounded-xl bg-white/5 p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-100/60">
                    Today's sharpest sleuths · {result.totalPlayers} played
                  </div>
                  <ol className="flex flex-col gap-1.5">
                    {result.leaderboard.map((e, i) => (
                      <li
                        key={e.username}
                        className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm ${
                          e.username === init?.username
                            ? 'bg-amber-400/15 text-amber-200'
                            : 'text-amber-50/90'
                        }`}
                      >
                        <span className="w-5 text-right font-mono text-amber-100/50">{i + 1}</span>
                        {e.snoovatar ? (
                          <img src={e.snoovatar} alt="" className="h-6 w-6 rounded-full bg-white/10" />
                        ) : (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs">
                            🕵️
                          </span>
                        )}
                        <span className="flex-1 truncate">u/{e.username}</span>
                        <span className="font-semibold">{e.score}/3</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <button
                onClick={share}
                disabled={shareState === 'busy' || shareState === 'done'}
                className="w-full rounded-full bg-amber-400 px-5 py-3 font-bold text-slate-950 transition-colors hover:bg-amber-300 disabled:opacity-60"
              >
                {shareState === 'done'
                  ? 'Posted to the comments ✓'
                  : shareState === 'busy'
                    ? 'Posting…'
                    : shareState === 'failed'
                      ? 'Try sharing again'
                      : 'Post my score to the comments'}
              </button>

              <p className="text-center text-sm text-amber-100/60">
                A fresh case drops at 00:00 UTC. Keep the streak alive.
              </p>
            </>
          )}
        </div>
      )}

      <footer className="text-xs text-amber-100/40">
        Subreddit Sleuth · {daily?.date ?? ''} {init ? `· playing as u/${init.username}` : ''}
      </footer>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
