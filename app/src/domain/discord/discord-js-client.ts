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

export type DiscordGatewayStatus = "disconnected" | "connecting" | "connected";

let client: Client | null = null;
let connectLoopRunning = false;
let stopConnectLoop = false;
let gatewayStatus: DiscordGatewayStatus = "disconnected";
let reconnectScheduled = false;
let connectParams: {
  token: string;
  guildId: string;
  warmMemberCache?: boolean;
} | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Adds up to 500ms jitter so parallel restarts do not align. */
export function applyDiscordGatewayRetryJitter(
  delayMs: number,
  isSessionRateLimit: boolean,
): number {
  if (isSessionRateLimit) {
    return delayMs;
  }
  return delayMs + Math.floor(Math.random() * 500);
}

/** Backoff delay before the next gateway login attempt (excludes jitter). */
export function baseDiscordGatewayRetryDelayMs(
  attempt: number,
  err: unknown,
  nowMs: number = Date.now(),
): number {
  const rateLimitDelayMs = discordSessionRateLimitDelayMs(err, nowMs);
  if (rateLimitDelayMs != null) {
    return rateLimitDelayMs;
  }
  return Math.min(1_000 * 2 ** Math.min(attempt, 5), 30_000);
}

export function isLikelyPermanentDiscordAuthError(message: string): boolean {
  return /401|TOKEN_INVALID|401 Unauthorized/i.test(message);
}

function setGatewayStatus(next: DiscordGatewayStatus): void {
  gatewayStatus = next;
}

export function getDiscordGatewayStatus(): DiscordGatewayStatus {
  if (client?.isReady() === true) {
    return "connected";
  }
  if (connectLoopRunning) {
    return "connecting";
  }
  return gatewayStatus;
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

function scheduleReconnectAfterDisconnect(reason: string): void {
  if (stopConnectLoop || reconnectScheduled || !connectParams) {
    return;
  }
  reconnectScheduled = true;

  void (async () => {
    try {
      logger.warn("Discord gateway disconnected; scheduling reconnect", { reason });
      logStartup(`Discord gateway disconnected (${reason}); reconnecting in background`);

      const active = client;
      client = null;
      setGatewayStatus("disconnected");

      if (active) {
        await active.destroy().catch(() => undefined);
      }

      reconnectScheduled = false;

      if (!stopConnectLoop) {
        runConnectLoop(connectParams);
      }
    } catch (err) {
      reconnectScheduled = false;
      logger.error("Discord gateway reconnect scheduling failed", {
        reason,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  })();
}

function attachReconnectHandlers(c: Client): void {
  c.once("invalidated", () => {
    scheduleReconnectAfterDisconnect("invalidated");
  });

  c.on("shardDisconnect", () => {
    scheduleReconnectAfterDisconnect("shardDisconnect");
  });

  c.on("error", (err) => {
    const message = err instanceof Error ? err.message : String(err);
    if (isLikelyPermanentDiscordAuthError(message)) {
      logger.error("Discord gateway client error (likely auth/config)", { message });
    } else {
      logger.warn("Discord gateway client error", { message });
    }
  });
}

function runConnectLoop(params: {
  token: string;
  guildId: string;
  warmMemberCache?: boolean;
}): void {
  if (client?.isReady() || connectLoopRunning) {
    return;
  }

  connectLoopRunning = true;
  setGatewayStatus("connecting");

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
        const connected = await loginAndWarm(params);
        client = connected;
        attachReconnectHandlers(connected);
        setGatewayStatus("connected");
        logStartup("Discord gateway connected");
        logger.log("Discord gateway connected");
        return;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const sessionRateLimit = isDiscordSessionRateLimitError(err);
        const baseDelayMs = baseDiscordGatewayRetryDelayMs(attempt, err);
        const delayMs = applyDiscordGatewayRetryJitter(baseDelayMs, sessionRateLimit);

        setGatewayStatus("disconnected");

        if (sessionRateLimit) {
          logStartup(
            `Discord gateway session rate limited; retrying in ${Math.ceil(delayMs / 1000)}s (${message})`,
          );
          logger.warn("Discord gateway session rate limited", { delayMs, message });
        } else if (isLikelyPermanentDiscordAuthError(message)) {
          logStartupError(
            "Discord gateway connection failed (check bot token / permissions)",
            err,
          );
          logger.error("Discord gateway connection failed (likely permanent)", {
            message,
            delayMs,
          });
        } else {
          logStartupError("Discord gateway connection failed", err);
          logger.error("Discord gateway connection failed", { message, delayMs });
        }

        await sleep(delayMs);
        if (!stopConnectLoop) {
          setGatewayStatus("connecting");
        }
      }
    }
  })().finally(() => {
    connectLoopRunning = false;
    if (!client?.isReady()) {
      setGatewayStatus("disconnected");
    }
  });
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
  if (client?.isReady()) {
    return;
  }

  connectParams = params;
  const connected = await loginAndWarm(params);
  client = connected;
  attachReconnectHandlers(connected);
  setGatewayStatus("connected");
}

export function isDiscordGatewayReady(): boolean {
  return getDiscordGatewayStatus() === "connected";
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
  connectParams = params;
  stopConnectLoop = false;
  runConnectLoop(params);
}

export function getDiscordGatewayClient(): Client {
  if (!client) {
    throw new Error("Discord gateway client not started");
  }
  return client;
}

/** Returns the live gateway client when connected; otherwise `null` (no throw). */
export function getDiscordGatewayClientIfReady(): Client | null {
  return client?.isReady() === true ? client : null;
}

export async function stopDiscordGatewayClient(): Promise<void> {
  stopConnectLoop = true;
  reconnectScheduled = false;
  if (client) {
    await client.destroy();
    client = null;
  }
  setGatewayStatus("disconnected");
}

/** Test-only reset of module singleton state. */
export function __resetDiscordGatewayClientForTests(): void {
  stopConnectLoop = true;
  reconnectScheduled = false;
  connectLoopRunning = false;
  client = null;
  connectParams = null;
  setGatewayStatus("disconnected");
  stopConnectLoop = false;
}
