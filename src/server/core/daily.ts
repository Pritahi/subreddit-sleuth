import { reddit, redis } from '@devvit/web/server';
import { POOL, POOL_BY_NAME } from '../../shared/pool';

// One daily round = one real Reddit post with its home subreddit hidden.
export type DailyRound = {
  postId: string;
  title: string;
  excerpt: string;
  permalink: string;
  answer: string;
  choices: string[];
  hint: string;
  blurb: string;
};

export type DailyPuzzle = {
  date: string;
  rounds: DailyRound[];
};

// --- deterministic day-seeded RNG (mulberry32) -----------------------------

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return out;
}

export function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD in UTC
}

// --- fallback pack: the game must never break ------------------------------
// Classic, well-known public Reddit posts used only if live fetching fails.

const FALLBACK: Omit<DailyRound, 'choices'>[] = [
  {
    postId: 'fallback-1',
    title: 'TIL that a single teaspoon of honey represents the life\'s work of 12 bees',
    excerpt: '',
    permalink: 'https://www.reddit.com/r/todayilearned/',
    answer: 'todayilearned',
    hint: POOL_BY_NAME['todayilearned']!.hints[0],
    blurb: POOL_BY_NAME['todayilearned']!.blurb,
  },
  {
    postId: 'fallback-2',
    title: 'My grandpa and his friends at 17, looking cooler than I ever will (1962)',
    excerpt: '',
    permalink: 'https://www.reddit.com/r/OldSchoolCool/',
    answer: 'OldSchoolCool',
    hint: POOL_BY_NAME['OldSchoolCool']!.hints[0],
    blurb: POOL_BY_NAME['OldSchoolCool']!.blurb,
  },
  {
    postId: 'fallback-3',
    title: '[WP] You die and wake up in a waiting room. A screen shows everyone currently reading your search history.',
    excerpt: '',
    permalink: 'https://www.reddit.com/r/WritingPrompts/',
    answer: 'WritingPrompts',
    hint: POOL_BY_NAME['WritingPrompts']!.hints[1],
    blurb: POOL_BY_NAME['WritingPrompts']!.blurb,
  },
];

function buildFallbackPuzzle(date: string): DailyPuzzle {
  const rnd = mulberry32(hashString(`sleuth-fallback-${date}`));
  const rounds: DailyRound[] = FALLBACK.map((r) => {
    const distractors = pickDistractors(r.answer, rnd);
    return { ...r, choices: shuffle([r.answer, ...distractors], rnd) };
  });
  return { date, rounds };
}

function pickDistractors(answer: string, rnd: () => number): string[] {
  const answerSub = POOL_BY_NAME[answer];
  const sameCat = POOL.filter((s) => s.category === answerSub?.category && s.name !== answer);
  const others = POOL.filter((s) => s.category !== answerSub?.category && s.name !== answer);
  const picks: string[] = [];
  const shuffledSame = shuffle(sameCat, rnd);
  const shuffledOthers = shuffle(others, rnd);
  // Prefer one same-category distractor (makes it challenging) + one random.
  if (shuffledSame.length > 0) picks.push(shuffledSame[0]!.name);
  for (const s of shuffledOthers) {
    if (picks.length >= 2) break;
    if (!picks.includes(s.name)) picks.push(s.name);
  }
  for (const s of shuffledSame.slice(1)) {
    if (picks.length >= 2) break;
    if (!picks.includes(s.name)) picks.push(s.name);
  }
  return picks.slice(0, 2);
}

// --- live content fetch ------------------------------------------------------

type PostCandidate = {
  id: string;
  title: string;
  excerpt: string;
  permalink: string;
};

function cleanText(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

async function fetchCandidate(subName: string, rnd: () => number): Promise<PostCandidate | null> {
  try {
    const listing = reddit.getTopPosts({ subredditName: subName, timeframe: 'week', limit: 40 });
    const posts = await listing.get(40);
    const good = posts.filter((p) => {
      const title = cleanText(p.title ?? '');
      if (p.nsfw || p.spoiler || p.stickied || p.locked) return false;
      if (title.length < 25 || title.length > 180) return false;
      if (/^\[?(removed|deleted)\]?$/i.test(title)) return false;
      if ((p.score ?? 0) < 300) return false;
      return true;
    });
    if (good.length === 0) return null;
    const pick = good[Math.floor(rnd() * good.length)];
    if (!pick) return null;
    const body = cleanText(pick.body ?? '');
    return {
      id: pick.id,
      title: cleanText(pick.title),
      excerpt: body.slice(0, 220),
      permalink: pick.permalink?.startsWith('http')
        ? pick.permalink
        : `https://www.reddit.com${pick.permalink ?? ''}`,
    };
  } catch (err) {
    console.error(`fetchCandidate failed for r/${subName}:`, err);
    return null;
  }
}

async function generateDaily(date: string): Promise<DailyPuzzle> {
  const rnd = mulberry32(hashString(`sleuth-${date}`));
  const subs = shuffle(POOL, rnd).slice(0, 3);
  const rounds: DailyRound[] = [];

  for (const sub of subs) {
    const cand = await fetchCandidate(sub.name, rnd);
    if (!cand) {
      // Any live failure degrades the whole puzzle to the fallback pack.
      return buildFallbackPuzzle(date);
    }
    const distractors = pickDistractors(sub.name, rnd);
    const hint = sub.hints[Math.floor(rnd() * sub.hints.length)] ?? sub.hints[0];
    rounds.push({
      postId: cand.id,
      title: cand.title,
      excerpt: cand.excerpt,
      permalink: cand.permalink,
      answer: sub.name,
      choices: shuffle([sub.name, ...distractors], rnd),
      hint,
      blurb: sub.blurb,
    });
  }
  return { date, rounds };
}

// --- redis-cached entry point -------------------------------------------------

export async function getDaily(): Promise<DailyPuzzle> {
  const date = dayKey();
  const key = `daily:${date}`;
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached) as DailyPuzzle;
  } catch (err) {
    console.error('daily cache read failed:', err);
  }
  let puzzle: DailyPuzzle;
  try {
    puzzle = await generateDaily(date);
  } catch (err) {
    console.error('generateDaily failed, using fallback:', err);
    puzzle = buildFallbackPuzzle(date);
  }
  try {
    await redis.set(key, JSON.stringify(puzzle));
    await redis.expire(key, 60 * 60 * 48);
  } catch (err) {
    console.error('daily cache write failed:', err);
  }
  return puzzle;
}
