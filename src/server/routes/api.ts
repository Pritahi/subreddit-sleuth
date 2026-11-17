import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import { telemetry } from '@devvit/analytics/server/reddit';
import type {
  CompleteResponse,
  DailyResponse,
  ErrorResponse,
  GuessRequest,
  GuessResponse,
  InitResponse,
  LeaderboardEntry,
  ShareResponse,
} from '../../shared/api';
import { getDaily, dayKey } from '../core/daily';
import { getLeaderboard, getProfile, getSession, recordCompletion, saveSession } from '../core/state';

export const api = new Hono();

const err = (message: string): ErrorResponse => ({ status: 'error', message });

async function currentUser(): Promise<{ userId: string | null; username: string | null }> {
  try {
    const [user, username] = await Promise.all([
      reddit.getCurrentUser(),
      reddit.getCurrentUsername(),
    ]);
    return { userId: user?.id ?? null, username: username ?? user?.username ?? null };
  } catch (e) {
    console.error('currentUser failed:', e);
    return { userId: null, username: null };
  }
}

api.get('/init', async (c) => {
  const { userId, username } = await currentUser();
  const date = dayKey();
  if (!userId) {
    return c.json<ErrorResponse>(err('Could not read your Reddit identity.'), 400);
  }
  const [profile, session] = await Promise.all([getProfile(userId), getSession(userId, date)]);
  let snoovatar: string | null = null;
  try {
    if (username) snoovatar = (await reddit.getSnoovatarUrl(username)) ?? null;
  } catch {
    /* optional */
  }
  return c.json<InitResponse>({
    type: 'init',
    username: username ?? 'detective',
    snoovatar,
    streak: profile.streak,
    best: profile.best,
    playedToday: session.done,
    todayScore: session.done ? session.score : null,
    date,
  });
});

api.get('/daily', async (c) => {
  const { userId } = await currentUser();
  if (!userId) return c.json<ErrorResponse>(err('Could not read your Reddit identity.'), 400);
  const date = dayKey();
  const [puzzle, session] = await Promise.all([getDaily(), getSession(userId, date)]);
  return c.json<DailyResponse>({
    type: 'daily',
    date,
    rounds: puzzle.rounds.map((r, i) => ({
      index: i,
      title: r.title,
      excerpt: r.excerpt,
      hint: r.hint,
      choices: r.choices,
      answered: session.guesses[i] !== null,
      answeredCorrect: session.guesses[i] ?? undefined,
    })),
    done: session.done,
    score: session.score,
  });
});

api.post('/guess', async (c) => {
  const { userId } = await currentUser();
  if (!userId) return c.json<ErrorResponse>(err('Could not read your Reddit identity.'), 400);
  let body: GuessRequest;
  try {
    body = await c.req.json<GuessRequest>();
  } catch {
    return c.json<ErrorResponse>(err('Bad request.'), 400);
  }
  const date = dayKey();
  const [puzzle, session] = await Promise.all([getDaily(), getSession(userId, date)]);
  const round = puzzle.rounds[body.round];
  if (!round) return c.json<ErrorResponse>(err('No such round.'), 400);
  if (session.guesses[body.round] !== null) {
    // Idempotent replay of an already-answered round.
    return c.json<GuessResponse>({
      type: 'guess',
      round: body.round,
      correct: session.guesses[body.round] === true,
      answer: round.answer,
      blurb: round.blurb,
      permalink: round.permalink,
    });
  }
  const correct = body.choice === round.answer;
  session.guesses[body.round] = correct;
  session.score = session.guesses.filter((g) => g === true).length;
  await saveSession(userId, date, session);
  return c.json<GuessResponse>({
    type: 'guess',
    round: body.round,
    correct,
    answer: round.answer,
    blurb: round.blurb,
    permalink: round.permalink,
  });
});

api.post('/complete', async (c) => {
  const { userId, username } = await currentUser();
  if (!userId || !username) {
    return c.json<ErrorResponse>(err('Could not read your Reddit identity.'), 400);
  }
  const date = dayKey();
  const session = await getSession(userId, date);
  if (session.guesses.some((g) => g === null)) {
    return c.json<ErrorResponse>(err('Finish all three rounds first.'), 400);
  }
  const score = session.score;
  if (!session.done) {
    session.done = true;
    await saveSession(userId, date, session);
  }
  const { profile, rank, totalPlayers } = await recordCompletion(userId, username, score);

  const top = await getLeaderboard(10);
  const leaderboard: LeaderboardEntry[] = await Promise.all(
    top.map(async ({ member, score: s }) => {
      let snoo: string | null = null;
      try {
        snoo = (await reddit.getSnoovatarUrl(member)) ?? null;
      } catch {
        /* optional */
      }
      return { username: member, score: s, snoovatar: snoo };
    })
  );

  return c.json<CompleteResponse>({
    type: 'complete',
    score,
    streak: profile.streak,
    best: profile.best,
    totalPlayers,
    leaderboard,
    rank,
  });
});

api.post('/share', async (c) => {
  const { postId } = context;
  const { userId, username } = await currentUser();
  if (!postId) return c.json<ErrorResponse>(err('No post context for sharing.'), 400);
  if (!userId || !username) {
    return c.json<ErrorResponse>(err('Could not read your Reddit identity.'), 400);
  }
  const date = dayKey();
  const session = await getSession(userId, date);
  if (!session.done) return c.json<ErrorResponse>(err('Finish the case first.'), 400);
  const profile = await getProfile(userId);

  // Share at most once per user per day (tracked server-side).
  const shareKey = `shared:${date}:${userId}`;
  try {
    if (await redis.get(shareKey)) {
      return c.json<ShareResponse>({ type: 'share', ok: true });
    }
  } catch {
    /* proceed */
  }

  const text = `🔍 I scored ${session.score}/3 on today's Subreddit Sleuth — streak ${profile.streak} day${profile.streak === 1 ? '' : 's'}. Think you can out-detect me?`;
  try {
    const comment = await reddit.submitComment({ id: postId, text });
    await redis.set(shareKey, '1');
    await redis.expire(shareKey, 60 * 60 * 72);
    const permalink = comment.permalink?.startsWith('http')
      ? comment.permalink
      : `https://www.reddit.com${comment.permalink ?? ''}`;
    return c.json<ShareResponse>({ type: 'share', ok: true, commentPermalink: permalink });
  } catch (e) {
    console.error('share comment failed:', e);
    return c.json<ErrorResponse>(err('Sharing failed — Reddit said no. Try again in a bit.'), 500);
  }
});

// --- Devvit Journeys telemetry bridge ---------------------------------------
// The web client posts here; we forward to the server-side telemetry plugin.

const telemetryRoute = new Hono();

telemetryRoute.post('/journey/start', async (c) => {
  const res = await telemetry.startJourney();
  return c.json(res);
});
telemetryRoute.post('/journey/progress', async (c) => {
  const body = await c.req.json();
  const res = await telemetry.journeyProgress(body);
  return c.json(res);
});
telemetryRoute.post('/journey/interaction', async (c) => {
  const body = await c.req.json();
  const res = await telemetry.journeyInteraction(body);
  return c.json(res);
});
telemetryRoute.post('/journey/end', async (c) => {
  const body = await c.req.json();
  const res = await telemetry.endJourney(body);
  return c.json(res);
});
telemetryRoute.post('/journey/app-ready', async (c) => {
  const res = await telemetry.appReady();
  return c.json(res);
});

api.route('/telemetry', telemetryRoute);
