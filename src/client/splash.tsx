import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const Magnifier = ({ className = 'w-10 h-10' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={className} aria-hidden="true">
    <circle cx="10.5" cy="10.5" r="6.5" />
    <line x1="15.5" y1="15.5" x2="21" y2="21" strokeLinecap="round" />
  </svg>
);

export const Splash = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-gradient-to-b from-slate-950 via-[#101b31] to-slate-950 px-6 py-10 text-center text-amber-50">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-400/10 text-amber-300">
        <Magnifier />
      </div>

      <div>
        <h1 className="text-3xl font-black tracking-tight text-amber-300">Subreddit Sleuth</h1>
        <p className="mt-2 max-w-sm text-base text-amber-50/80">
          Three real Reddit posts. Three possible homes. One detective: you.
        </p>
      </div>

      <ul className="flex flex-col gap-1.5 text-sm text-amber-100/70">
        <li>🔎 Read today's three mystery posts</li>
        <li>🎯 Guess which subreddit each came from</li>
        <li>🔥 Build a daily streak and top the leaderboard</li>
      </ul>

      <button
        className="mt-2 rounded-full bg-amber-400 px-8 py-3.5 text-lg font-bold text-slate-950 shadow-lg transition-colors hover:bg-amber-300"
        onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
      >
        Open today's case
      </button>

      <p className="text-xs text-amber-100/40">A fresh case every day · free to play</p>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
