import fetch from 'isomorphic-fetch';
import { DISCORD_PUBLIC_WEBHOOK_URL, DISCORD_PRIVATE_WEBHOOK_URL } from './env';

export function postToDiscord(
  content: string,
  isPublic = true
): Promise<Response> {
  const webhookURL = isPublic
    ? DISCORD_PUBLIC_WEBHOOK_URL
    : DISCORD_PRIVATE_WEBHOOK_URL;
  return fetch(webhookURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'BottyMcBotface',
      content.substring(0,2000) /* MAX Discord MSG Length is 2000 */,
    }),
  });
}
