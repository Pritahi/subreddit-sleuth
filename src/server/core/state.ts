import { redis } from '@devvit/web/server';
import { dayKey } from './daily';

// Per-user daily session: which rounds were guessed and how they went.
export type Session = {
  guesses: (boolean | null)[]; // index by round
  done: boolean;
  score: number;
};

export type Profile = {
  streak: number;
  best: number;
  lastPlayed: string; // YYYY-MM-DD or ''
};

const emptySession = (): Session => ({ guesses: [null, null, null], done: false, score: 0 });
const emptyProfile = (): Profile => ({ streak: 0, best: 0, lastPlayed: '' });

function sessKey(userId: string, date: string): string {
  return `sess:${date}:${userId}`;
}

export async function getSession(userId: string, date: string): Promise<Session> {
  try {
    const raw = await redis.get(sessKey(userId, date));
    if (raw) return JSON.parse(raw) as Session;
  } catch (err) {
    console.error('session read failed:', err);
  }
  return emptySession();
}

export async function saveSession(userId: string, date: string, s: Session): Promise<void> {
  try {
    await redis.set(sessKey(userId, date), JSON.stringify(s));
    await redis.expire(sessKey(userId, date), 60 * 60 * 72);
  } catch (err) {
    console.error('session write failed:', err);
  }
}

export async function getProfile(userId: string): Promise<Profile> {
  try {
    const raw = await redis.hGet('profiles', userId);
    if (raw) return JSON.parse(raw) as Profile;
  } catch (err) {
    console.error('profile read failed:', err);
  }
  return emptyProfile();
}

async function saveProfile(userId: string, p: Profile): Promise<void> {
  try {
    await redis.hSet('profiles', { [userId]: JSON.stringify(p) });
  } catch (err) {
    console.error('profile write failed:', err);
  }
}

function yesterday(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Record a completed day: streaks, personal best, leaderboard entry.
// Returns the updated profile. Safe to call once per user per day —
// the session.done flag guards double-counting.
export async function recordCompletion(
  userId: string,
  username: string,
  score: number
): Promise<{ profile: Profile; rank: number | null; totalPlayers: number }> {
  const date = dayKey();
  const profile = await getProfile(userId);

  if (profile.lastPlayed !== date) {
    profile.streak = profile.lastPlayed === yesterday(date) ? profile.streak + 1 : 1;
    profile.lastPlayed = date;
    if (score > profile.best) profile.best = score;
    await saveProfile(userId, profile);
    try {
      await redis.incrBy(`players:${date}`, 1);
      await redis.expire(`players:${date}`, 60 * 60 * 72);
    } catch (err) {
      console.error('player counter failed:', err);
    }
  }

  let rank: number | null = null;
  try {
    // Highest score wins; ties keep the better (earlier-achieved max) score.
    const prev = await redis.zScore(`lb:${date}`, username);
    if (prev === undefined || score > prev) {
      await redis.zAdd(`lb:${date}`, { member: username, score });
      await redis.expire(`lb:${date}`, 60 * 60 * 72);
    }
    const r = await redis.zRank(`lb:${date}`, username);
    if (r !== undefined) {
      const total = await redis.zCard(`lb:${date}`);
      rank = total - r; // zRank is ascending; convert to 1-based descending
    }
  } catch (err) {
    console.error('leaderboard write failed:', err);
  }

  let totalPlayers = 1;
  try {
    const raw = await redis.get(`players:${date}`);
    if (raw) totalPlayers = parseInt(raw, 10) || 1;
  } catch {
    /* keep default */
  }

  return { profile, rank, totalPlayers };
}

export async function getLeaderboard(
  limit = 10
): Promise<{ member: string; score: number }[]> {
  const date = dayKey();
  try {
    return await redis.zRange(`lb:${date}`, 0, limit - 1, { by: 'rank', reverse: true });
  } catch (err) {
    console.error('leaderboard read failed:', err);
    return [];
  }
}
