import { Client, GatewayIntentBits } from "discord.js";
import { createLogger } from "@mendahu/utilities";
import { logStartup, logStartupError } from "@shared/startup-log";
import {
  discordSessionRateLimitDelayMs,
  isDiscordSessionRateLimitError,
} from "./discord-session-rate-limit";

const logger = createLogger({
  namespace: "NDB2/Discord",
  env: ["dev", "development", "production"],
});

let client: Client | null = null;
let connectLoopRunning = false;
let stopConnectLoop = false;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loginAndWarm(params: {
  token: string;
  guildId: string;
  warmMemberCache?: boolean;
}): Promise<Client> {
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
    return c;
  } catch (err) {
    await c.destroy();
    throw err;
  }
}

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

  client = await loginAndWarm(params);
}

export function isDiscordGatewayReady(): boolean {
  return client?.isReady() === true;
}

/**
 * Connects to the Discord gateway in the background with retry/backoff. Does not
 * block HTTP startup — member-profile UIs degrade until the client is ready.
 */
export function connectDiscordGatewayInBackground(params: {
  token: string;
  guildId: string;
  warmMemberCache?: boolean;
}): void {
  if (client || connectLoopRunning) {
    return;
  }

  connectLoopRunning = true;
  stopConnectLoop = false;

  void (async () => {
    let attempt = 0;

    while (!client && !stopConnectLoop) {
      attempt += 1;
      try {
        logStartup(
          attempt === 1
            ? "Connecting Discord gateway in background"
            : `Retrying Discord gateway connection (attempt ${attempt})`,
        );
        client = await loginAndWarm(params);
        logStartup("Discord gateway connected");
        logger.log("Discord gateway connected");
        return;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const rateLimitDelayMs = discordSessionRateLimitDelayMs(err);
        const delayMs =
          rateLimitDelayMs ??
          Math.min(1_000 * 2 ** Math.min(attempt, 5), 30_000);

        if (isDiscordSessionRateLimitError(err)) {
          logStartup(
            `Discord gateway session rate limited; retrying in ${Math.ceil(delayMs / 1000)}s (${message})`,
          );
          logger.warn("Discord gateway session rate limited", { delayMs, message });
        } else {
          logStartupError("Discord gateway connection failed", err);
          logger.error("Discord gateway connection failed", { message, delayMs });
        }

        await sleep(delayMs);
      }
    }
  })().finally(() => {
    connectLoopRunning = false;
  });
}

export function getDiscordGatewayClient(): Client {
  if (!client) {
    throw new Error("Discord gateway client not started");
  }
  return client;
}

export async function stopDiscordGatewayClient(): Promise<void> {
  stopConnectLoop = true;
  if (client) {
    await client.destroy();
    client = null;
  }
}
