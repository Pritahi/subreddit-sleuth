# Subreddit Sleuth 🔍

**Three real Reddit posts. Three possible homes. One detective: you.**

Subreddit Sleuth is a daily deduction game built for Reddit with Devvit Web. Every day at 00:00 UTC a fresh case file opens: three real posts pulled live from Reddit, each with its home subreddit hidden. Read the evidence, use the hint, and guess where each post lives. Build a streak, top the daily leaderboard, and post your score to the comments to challenge the community.

## How to play

1. Open today's case post (a new one drops every day).
2. Tap **Open today's case**.
3. For each of the 3 rounds, read the real post title (and a hint) and pick the subreddit it came from out of 3 candidates.
4. Get your daily report: score /3, day streak 🔥, personal best, and your rank on today's leaderboard.
5. Post your score to the comments in one tap — then come back tomorrow to keep the streak alive.

## What makes it Reddit-native

- **Real Reddit content, fetched server-side** — each day's rounds are real, current posts pulled through the Reddit API from a curated pool of 32 beloved communities. Content is refreshed daily, so the game is never the same twice.
- **Comments as the clubhouse** — one tap posts your score to the day's post, turning the comment section into the daily bragging thread.
- **Leaderboard + streaks** — today's sharpest sleuths (with snoovatars) ranked in the result card; streaks tracked per player in Redis.
- **Devvit Journeys instrumentation** — app-ready, journey start, per-round progress, interactions, and end events with score.
- **Graceful failure** — if live fetching ever fails, the game falls back to a curated classic-post pack so the daily case never breaks.

## Tech

- Devvit Web (React 19 + Tailwind 4 client, Hono server), Redis for daily cache, sessions, profiles and leaderboards.
- Server-side only Reddit API calls (`getTopPosts` from a curated, SFW subreddit pool; NSFW/spoiler/stickied posts filtered out).
- Day-seeded RNG (UTC date) so every player gets the same case each day; guesses are verified server-side.
- No external APIs, no paid services, no tracking.

## Development

```bash
npm install
npm run dev      # playtest in your test subreddit
npm run build    # type-safe production build
npm run deploy   # typecheck + lint + devvit upload
```

Moderators can post a fresh daily case from the subreddit ⋮ menu → **Post today's Subreddit Sleuth**.

## Content notes

All post content displayed in the game is public Reddit content shown inside Reddit itself, fetched via the official Reddit API. Author names are never displayed. NSFW, spoiler, stickied and locked posts are excluded.
