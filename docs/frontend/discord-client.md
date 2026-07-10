# Discord integration (web)

**Status:** Implemented. The web app uses **two** Discord integration paths:

1. **Bot REST** (`fetchGuildMember` in `app/src/domain/discord/discord-gateway.ts`) — guild membership and role checks for OAuth sign-in, session recheck, and admin gates. Does **not** require the `discord.js` gateway client.
2. **`discord.js` gateway** (`app/src/domain/discord/discord-js-client.ts`) — long-lived client for member profile enrichment (display names, avatars) on authenticated pages. **Web-only**; the JSON API does not depend on it.

## Boot and retry

On startup (`app/src/index.ts`), after the database is ready, `connectDiscordGatewayInBackground()` runs **without blocking** HTTP or `markReady()`. The gateway connects in a background loop with:

- Session IDENTIFY rate-limit detection (`discord-session-rate-limit.ts`) — waits until Discord’s reset timestamp before retrying.
- Exponential backoff (capped at 30s) with jitter for other failures.
- Automatic reconnect after `shardDisconnect` / `invalidated`.

`/health` reports `discord` (`connected` | `connecting`) and `discordStatus` (`connected` | `connecting` | `disconnected`) when the app is ready. Discord gateway state does **not** affect readiness.

## Profile enrichment

Domain helpers in `app/src/domain/discord/discord-member-profile.ts`:

| API | Behavior when gateway unavailable |
|-----|-----------------------------------|
| `getMemberProfile` | Throws (strict; for callers that require gateway data) |
| `tryGetMemberProfile` | Returns `fallbackMemberProfile` (snowflake + default embed avatar) |
| `getMemberProfilesGuildOnly` | Returns `null` per id (leaderboard uses placeholders) |
| `fallbackMemberProfile` | Snowflake display name + CDN default avatar |

Web authenticated routes use `tryGetMemberProfile` via `resolveAuthenticatedShell` (`app/src/web/auth/resolve-authenticated-shell.ts`).

## Authorization (guild + roles)

Role verification uses **Bot REST**, not the gateway client:

- OAuth callback and session recheck: `config.discord.webPortal.allowedRoleIds`
- Admin routes: `config.discord.webPortal.adminRoleIds`

Env: `DISCORD_BOT_TOKEN`, `OFFNOMDISCORD_GUILD_ID`, `ROLE_ID_*`, `WEB_ADMIN_ROLE_*`, `DISCORD_OAUTH_*`.

If REST role checks fail during sign-in, users see an access-denied page. Transient REST errors during session recheck keep the existing session (fail open until the next recheck).

## Failure modes and UX

| Layer | Gateway down | Policy |
|-------|--------------|--------|
| Boot | Connecting in background | App stays up; `markReady()` unaffected |
| Sign-in / roles | REST may still work | Unaffected by gateway state |
| Profile display | `tryGetMemberProfile` fallback | Snowflake + default avatar; leaderboard placeholders |
| Authenticated shell | `DiscordGatewayBanner` | Non-blocking status strip at top of `AuthenticatedPageLayout` |

The app does **not** block the web experience when the gateway is unavailable — users can still sign in (via REST) and use the site with degraded names/avatars.

## Module layout

- `discord-gateway.ts` — Bot REST guild member lookup
- `discord-js-client.ts` — gateway singleton, connect loop, status
- `discord-member-profile.ts` — profile resolution and batch lookups
- `member-has-any-role.ts` — role intersection helper

## Future expansions

- Persisting profile snapshots in Postgres (less cold-start pain).
- Webhook-driven member updates for fresher profile data with fewer polls.
- Shared cache (e.g. Redis) if multiple app instances need consistent profile snapshots.
