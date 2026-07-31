import { WebClient } from "@slack/web-api";

/**
 * Create an authenticated Slack Web API client.
 */
export function getSlackClient(accessToken: string): WebClient {
  return new WebClient(accessToken);
}

export interface SlackMessage {
  ts: string;
  channelId: string;
  channelName: string;
  userId: string;
  userName: string;
  text: string;
  threadTs?: string;
  sentAt: Date;
}

/**
 * Fetch recent messages from all accessible channels.
 */
export async function fetchRecentMessages(
  accessToken: string,
  maxPerChannel = 20
): Promise<SlackMessage[]> {
  const client = getSlackClient(accessToken);
  const messages: SlackMessage[] = [];

  // Get list of channels
  const channelsResponse = await client.conversations.list({
    types: "public_channel,private_channel",
    limit: 50,
  });

  if (!channelsResponse.channels) return messages;

  // Cache user names
  const userCache = new Map<string, string>();
  async function getUserName(userId: string): Promise<string> {
    if (userCache.has(userId)) return userCache.get(userId)!;
    try {
      const user = await client.users.info({ user: userId });
      const name = user.user?.real_name || user.user?.name || userId;
      userCache.set(userId, name);
      return name;
    } catch {
      return userId;
    }
  }

  // Fetch messages from each channel
  for (const channel of channelsResponse.channels.slice(0, 10)) {
    if (!channel.id || !channel.name) continue;

    try {
      const history = await client.conversations.history({
        channel: channel.id,
        limit: maxPerChannel,
      });

      if (!history.messages) continue;

      for (const msg of history.messages) {
        if (!msg.ts || !msg.user || msg.subtype) continue; // Skip bot messages

        const userName = await getUserName(msg.user);
        messages.push({
          ts: msg.ts,
          channelId: channel.id,
          channelName: channel.name,
          userId: msg.user,
          userName,
          text: msg.text || "",
          threadTs: msg.thread_ts,
          sentAt: new Date(Number(msg.ts) * 1000),
        });
      }
    } catch {
      // Channel might not be accessible
      continue;
    }
  }

  return messages;
}
