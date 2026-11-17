import { reddit } from '@devvit/web/server';
import { dayKey } from './daily';

export const createDailyPost = async () => {
  const date = dayKey();
  return await reddit.submitCustomPost({
    title: `🔍 Subreddit Sleuth — the daily case for ${date}`,
    sendreplies: false,
  });
};
