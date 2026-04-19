/**
 * Sets `process.env` before any module loads `@config` (via `@shared/utils` or other imports).
 * - Vitest `setupFiles`: run before test files in each worker.
 * - Import first from `global-setup.ts` so the Vitest main process has env before `@config` loads.
 */

process.env.TZ = "UTC";
process.env.NODE_ENV = "test";

process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  process.env.TEST_POSTGRES_BASE_URL ??
  "postgresql://test_user:test_password@localhost:5433/ndb2_test";

process.env.GM_PREDICTION_UPDATE_WINDOW_HOURS =
  process.env.GM_PREDICTION_UPDATE_WINDOW_HOURS ?? "24";

process.env.DISCORD_CLIENT_API_KEY =
  process.env.DISCORD_CLIENT_API_KEY ?? "test_discord_client_api_key";

process.env.DISCORD_OAUTH_CLIENT_ID =
  process.env.DISCORD_OAUTH_CLIENT_ID ?? "test_oauth_client_id";
process.env.DISCORD_OAUTH_CLIENT_SECRET =
  process.env.DISCORD_OAUTH_CLIENT_SECRET ?? "test_oauth_client_secret";
process.env.DISCORD_OAUTH_REDIRECT_URI =
  process.env.DISCORD_OAUTH_REDIRECT_URI ??
  "http://localhost:8000/auth/discord/callback";

process.env.DISCORD_BOT_TOKEN =
  process.env.DISCORD_BOT_TOKEN ?? "test_discord_bot_token";
process.env.OFFNOMDISCORD_GUILD_ID =
  process.env.OFFNOMDISCORD_GUILD_ID ?? "123456789012345678";

if (!Object.keys(process.env).some((k) => k.startsWith("ROLE_ID_") && process.env[k]?.trim())) {
  process.env.ROLE_ID_TEST = "987654321098765432";
}
