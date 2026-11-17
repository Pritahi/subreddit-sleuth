// Shared types between client and server.

export type RoundPublic = {
  index: number;
  title: string;
  excerpt: string;
  hint: string;
  choices: string[]; // 3 subreddit names, shuffled
  answered: boolean;
  answeredCorrect?: boolean;
};

export type DailyResponse = {
  type: 'daily';
  date: string; // YYYY-MM-DD (UTC)
  rounds: RoundPublic[];
  done: boolean;
  score: number;
};

export type GuessRequest = {
  round: number;
  choice: string;
};

export type GuessResponse = {
  type: 'guess';
  round: number;
  correct: boolean;
  answer: string;
  blurb: string;
  permalink: string;
};

export type InitResponse = {
  type: 'init';
  username: string;
  snoovatar: string | null;
  streak: number;
  best: number;
  playedToday: boolean;
  todayScore: number | null;
  date: string;
};

export type LeaderboardEntry = {
  username: string;
  score: number;
  snoovatar: string | null;
};

export type CompleteResponse = {
  type: 'complete';
  score: number;
  streak: number;
  best: number;
  totalPlayers: number;
  leaderboard: LeaderboardEntry[];
  rank: number | null;
};

export type ShareResponse = {
  type: 'share';
  ok: boolean;
  commentPermalink?: string;
};

export type ErrorResponse = {
  status: 'error';
  message: string;
};
