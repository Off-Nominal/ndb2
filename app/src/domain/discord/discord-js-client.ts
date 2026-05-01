import { Client, GatewayIntentBits } from "discord.js";

let client: Client | null = null;

/**
 * Logs in, optionally warms the portal guild member cache (`GuildMemberManager.fetch()`),
 * and keeps the client for the process lifetime.
 */
export async function startDiscordGatewayClient(params: {
  token: string;
  guildId: string;
  /** When true (default), `await guild.members.fetch()` once so list UIs can read the cache. */
  warmMemberCache?: boolean;
}): Promise<void> {
  if (client) {
    return;
  }

  const c = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  });

  try {
    await c.login(params.token);
    const warm = params.warmMemberCache !== false;
    if (warm) {
      const guild = await c.guilds.fetch(params.guildId);
      await guild.members.fetch();
    }
    client = c;
  } catch (err) {
    await c.destroy();
    throw err;
  }
}

export function getDiscordGatewayClient(): Client {
  if (!client) {
    throw new Error("Discord gateway client not started");
  }
  return client;
}

export async function stopDiscordGatewayClient(): Promise<void> {
  if (client) {
    await client.destroy();
    client = null;
  }
}
