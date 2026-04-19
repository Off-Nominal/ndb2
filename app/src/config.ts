import { z, ZodError } from "zod";

const DEFAULT_AUTHZ_RECHECK_HOURS = 24;

/** Every `ROLE_ID_*` value from the environment (non-empty). */
export function collectWebPortalRoleIdsFromEnv(
  env: NodeJS.ProcessEnv,
): string[] {
  const ids: string[] = [];
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith("ROLE_ID_") && value?.trim()) {
      ids.push(value.trim());
    }
  }
  return ids;
}

const nonEmptyTrimmed = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(1));

const webDiscordAuthzRecheckHoursSchema = z.preprocess(
  (val: unknown) => {
    if (val === undefined || val === null) {
      return DEFAULT_AUTHZ_RECHECK_HOURS;
    }
    const t = String(val).trim();
    if (t === "") {
      return DEFAULT_AUTHZ_RECHECK_HOURS;
    }
    const n = Number(t);
    if (!Number.isFinite(n) || n <= 0) {
      return DEFAULT_AUTHZ_RECHECK_HOURS;
    }
    return t;
  },
  z.coerce.number().positive(),
);

const rawConfigSchema = z.object({
  nodeEnv: z.string().optional(),
  port: z.preprocess(
    (v) =>
      v === undefined || v === null || String(v).trim() === "" ? 80 : v,
    z.coerce.number().int().positive(),
  ),
  databaseUrl: nonEmptyTrimmed,
  pgPoolMax: z.preprocess(
    (v) =>
      v === undefined || v === null || String(v).trim() === "" ? 10 : v,
    z.coerce.number().int().positive(),
  ),
  trustProxyRaw: z.string().optional(),
  discordClientApiKey: nonEmptyTrimmed,
  /** Base URL for Mission Control webhooks; empty/absent means no webhook subscribers. */
  webhookDiscordBotBaseUrl: z
    .string()
    .optional()
    .transform((s) => {
      const t = s?.trim();
      return t === "" || t === undefined ? undefined : t;
    }),
  gmPredictionUpdateWindowHours: z.coerce
    .number()
    .positive()
    .refine((n) => Number.isInteger(n), "Must be an integer number of hours"),
  discordOAuthClientId: nonEmptyTrimmed,
  discordOAuthClientSecret: nonEmptyTrimmed,
  discordOAuthRedirectUri: nonEmptyTrimmed,
  discordBotToken: nonEmptyTrimmed,
  offnomDiscordGuildId: nonEmptyTrimmed,
  webPortalAllowedRoleIds: z
    .array(z.string().min(1))
    .min(1, "Set at least one ROLE_ID_* with an allowed Discord role id"),
  webDiscordAuthzRecheckHours: webDiscordAuthzRecheckHoursSchema,
});

export type RawAppConfig = z.infer<typeof rawConfigSchema>;

/** Maps {@link buildRawFromProcessEnv} keys to `process.env` variable names for error messages. */
const RAW_FIELD_TO_ENV_NAME: Record<string, string> = {
  nodeEnv: "NODE_ENV",
  port: "PORT",
  databaseUrl: "DATABASE_URL",
  pgPoolMax: "PG_POOL_MAX",
  trustProxyRaw: "TRUST_PROXY",
  discordClientApiKey: "DISCORD_CLIENT_API_KEY",
  webhookDiscordBotBaseUrl: "WEBHOOK_DISCORD_BOT",
  gmPredictionUpdateWindowHours: "GM_PREDICTION_UPDATE_WINDOW_HOURS",
  discordOAuthClientId: "DISCORD_OAUTH_CLIENT_ID",
  discordOAuthClientSecret: "DISCORD_OAUTH_CLIENT_SECRET",
  discordOAuthRedirectUri: "DISCORD_OAUTH_REDIRECT_URI",
  discordBotToken: "DISCORD_BOT_TOKEN",
  offnomDiscordGuildId: "OFFNOMDISCORD_GUILD_ID",
  webPortalAllowedRoleIds:
    "ROLE_ID_* (at least one, e.g. ROLE_ID_HOST=…)",
  webDiscordAuthzRecheckHours: "WEB_DISCORD_AUTHZ_RECHECK_HOURS",
};

function humanizeConfigIssue(
  issue: ZodError["issues"][number],
  envName: string,
): string {
  const code = issue.code;
  if (code === "invalid_type") {
    // Prefer friendly copy when the value was omitted; Zod may omit `input` on the issue.
    const msg = issue.message.toLowerCase();
    if (msg.includes("received undefined")) {
      return `Required but not set. Define ${envName} in your environment or .env file.`;
    }
    return issue.message;
  }
  if (code === "too_small") {
    if (issue.origin === "string" && issue.minimum === 1 && issue.inclusive) {
      return `Cannot be empty (whitespace-only is treated as empty). Set ${envName} to a non-empty value.`;
    }
    if (issue.origin === "array") {
      return issue.message;
    }
    return issue.message;
  }
  if (code === "too_big") {
    return issue.message;
  }
  return issue.message;
}

/**
 * Multi-line message listing each problem with the corresponding env var name.
 * Suitable for logging when {@link loadConfig} throws {@link ZodError}.
 */
export function formatConfigError(err: ZodError): string {
  const lines: string[] = [
    "Invalid configuration — fix the following and restart:",
    "",
  ];

  for (const issue of err.issues) {
    const path = issue.path;
    const key =
      path.length > 0 && typeof path[0] === "string" ? path[0] : null;
    const envName =
      key !== null && key in RAW_FIELD_TO_ENV_NAME
        ? RAW_FIELD_TO_ENV_NAME[key]
        : key ?? "(unknown)";

    lines.push(`  • ${envName}`);
    lines.push(`    ${humanizeConfigIssue(issue, envName)}`);
    lines.push("");
  }

  lines.push(
    "Tip: start from `app/.env.example`, or set variables in your shell / host / CI.",
  );
  return lines.join("\n");
}

const ANSI_RED = "\x1b[31m";
const ANSI_RESET = "\x1b[0m";

/**
 * Whether to emit ANSI red for config errors on stderr. Honors
 * [NO_COLOR](https://no-color.org/), `FORCE_COLOR`, and `stderr.isTTY`.
 */
function stderrSupportsAnsiColor(): boolean {
  if ("NO_COLOR" in process.env) {
    return false;
  }
  if (
    process.env.FORCE_COLOR !== undefined &&
    process.env.FORCE_COLOR !== "0"
  ) {
    return true;
  }
  return process.stderr.isTTY === true;
}

function colorizeStderrMessage(message: string): string {
  if (!stderrSupportsAnsiColor()) {
    return message;
  }
  return `${ANSI_RED}${message}${ANSI_RESET}`;
}

export type TrustProxyResolved =
  | { apply: false }
  | { apply: true; hops: number };

/**
 * Mirrors previous `configureTrustProxy` env behavior using parsed NODE_ENV + TRUST_PROXY.
 */
export function resolveTrustProxy(
  nodeEnv: string | undefined,
  trustProxyRaw: string | undefined,
): TrustProxyResolved {
  const raw = trustProxyRaw?.trim();

  if (raw === "0" || raw === "false") {
    return { apply: false };
  }
  if (raw === "1" || raw === "true") {
    return { apply: true, hops: 1 };
  }
  if (raw && /^\d+$/.test(raw)) {
    return { apply: true, hops: Number.parseInt(raw, 10) };
  }
  if (nodeEnv === "production") {
    return { apply: true, hops: 1 };
  }
  return { apply: false };
}

const appConfigSchema = rawConfigSchema.transform((raw) => ({
  nodeEnv: raw.nodeEnv,
  port: raw.port,
  database: {
    url: raw.databaseUrl,
    poolMax: raw.pgPoolMax,
  },
  server: {
    trustProxy: resolveTrustProxy(raw.nodeEnv, raw.trustProxyRaw),
  },
  api: {
    discordClientApiKey: raw.discordClientApiKey,
  },
  webhooks: {
    missionControlBaseUrl: raw.webhookDiscordBotBaseUrl,
  },
  gameMechanics: {
    predictionUpdateWindowHours: raw.gmPredictionUpdateWindowHours,
  },
  discord: {
    oauth: {
      clientId: raw.discordOAuthClientId,
      clientSecret: raw.discordOAuthClientSecret,
      redirectUri: raw.discordOAuthRedirectUri,
    },
    webPortal: {
      botToken: raw.discordBotToken,
      guildId: raw.offnomDiscordGuildId,
      allowedRoleIds: raw.webPortalAllowedRoleIds,
    },
    authzRecheckMs: raw.webDiscordAuthzRecheckHours * 60 * 60 * 1000,
  },
}));

export type AppConfig = z.infer<typeof appConfigSchema>;

function buildRawFromProcessEnv(): unknown {
  return {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    databaseUrl: process.env.DATABASE_URL,
    pgPoolMax: process.env.PG_POOL_MAX,
    trustProxyRaw: process.env.TRUST_PROXY,
    discordClientApiKey: process.env.DISCORD_CLIENT_API_KEY,
    webhookDiscordBotBaseUrl: process.env.WEBHOOK_DISCORD_BOT,
    gmPredictionUpdateWindowHours: process.env.GM_PREDICTION_UPDATE_WINDOW_HOURS,
    discordOAuthClientId: process.env.DISCORD_OAUTH_CLIENT_ID,
    discordOAuthClientSecret: process.env.DISCORD_OAUTH_CLIENT_SECRET,
    discordOAuthRedirectUri: process.env.DISCORD_OAUTH_REDIRECT_URI,
    discordBotToken: process.env.DISCORD_BOT_TOKEN,
    offnomDiscordGuildId: process.env.OFFNOMDISCORD_GUILD_ID,
    webPortalAllowedRoleIds: collectWebPortalRoleIdsFromEnv(process.env),
    webDiscordAuthzRecheckHours: process.env.WEB_DISCORD_AUTHZ_RECHECK_HOURS,
  };
}

function loadConfig(): AppConfig {
  const raw = buildRawFromProcessEnv();
  try {
    return appConfigSchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      console.error(colorizeStderrMessage(formatConfigError(err)));
      process.exit(1);
    }
    throw err;
  }
}

export const config = loadConfig();
