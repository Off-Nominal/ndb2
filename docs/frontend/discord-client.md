# Discord client plan (`discord.js`)

**Status:** Web OAuth **authorization** (guild + allowed roles) uses the Discord Bot REST API via `app/src/domain/discord/` (`fetchGuildMember`, env-driven guild/roles). A long-lived `discord.js` client is still **not** wired; the service module is the single gateway to extend for member/profile lookups and can be backed by `discord.js` later without changing OAuth call sites.

The web app needs a reliable way to fetch and display Discord user metadata (display name, avatar) and to enforce authorization rules based on **guild membership** and **roles**.

This document outlines a plan to add `discord.js` as an `app/` dependency and run a long-lived Discord client alongside the web server.

## Goals

- **User metadata**: given a `discordId`, resolve:
  - display name (prefer guild-specific nickname/display name where applicable)
  - avatar URL (prefer guild avatar if available, else global avatar)
- **Authorization**:
  - user must be a member of the ndb2 Discord guild
  - user must have one or more required roles (configurable)
- **Performance**:
  - avoid calling Discord APIs on every request
  - use `discord.js` caching + targeted refreshes
- **Separation of concerns**:
  - authentication: session → (`userId`, `discordId`)
  - authorization/enrichment: Discord lookups → (role checks + profile fields)

## Why `discord.js` vs raw HTTP

We could call Discord’s REST API directly, but `discord.js` provides:
- built-in caching semantics for users/members
- convenient guild/member/role lookup APIs
- a consistent abstraction for future Discord-related features

## Proposed architecture

### A long-lived Discord client

Run a single `discord.js` client instance within the `app` process:
- initialize at server startup
- log in using a bot token
- keep it alive for the life of the server process

Important constraints:
- this is a server-side bot integration (not user OAuth)
- bot must have permissions to fetch members and read roles in the guild

### A small internal service wrapper

Expose a narrow module API that the rest of the codebase uses (do not spread `discord.js` calls everywhere):

**Current (`app/src/domain/discord/`):** `fetchGuildMember` (REST); portal guild/roles come from `config.discord.webPortal` (`@config`). Web routes call the gateway and enforce guild + role checks inline.

**Planned on top of the same gateway:**

- `discordService.getMemberProfile(discordId)` → `{ displayName, avatarUrl } | null`
- `discordService.assertAuthorized(discordId, requirements)` → throws/returns error when:
  - not in guild
  - missing roles
- `discordService.warmup()` / `startBackgroundRefresh()` (optional)

This wrapper gives us a single place to:
- define caching/refresh behavior
- translate Discord API errors into application errors
- centralize rate-limit handling and logging

## Caching and background refresh

`discord.js` maintains in-memory caches for users/members. We should lean on that, but still plan for:
- cold starts (empty cache)
- cache misses (member not cached yet)
- stale display name/avatar changes

Recommended approach:
- On request-time cache miss, fetch the member from Discord (bounded by rate limits).
- Maintain a small in-process cache of “profile snapshots” keyed by `discordId` with:
  - `displayName`, `avatarUrl`
  - `fetchedAt`
  - `expiresAt` (short TTL; e.g. 5–30 minutes depending on load)
- Background refresh loop (optional but likely valuable):
  - periodically refresh the most recently used N profiles
  - or refresh profiles for active sessions/users

If the app will run multiple server instances, note:
- `discord.js` caches are per-process
- for scale, we may later need a shared cache (e.g. Redis), but we can start in-process

## Where it plugs into request handling

### Authentication (session) middleware

This middleware only answers: “who is the user?”

- loads session cookie
- resolves local `userId` + `discordId`
- stores `{ userId, discordId }` in `AsyncLocalStorage` auth context

### Authorization + enrichment middleware

This middleware answers: “may they access this?” and “what user display info do we show?”

- reads `{ discordId }` from auth context
- loads guild member via `discordService`
- verifies membership + roles
- stores an additional context payload (authorization context), e.g.:
  - `displayName`
  - `avatarUrl`
  - `roles` (optional: role ids/names used for gating)

This keeps auth concerns separate and allows:
- public pages that require auth but not strict roles
- admin pages that require specific roles
- templates to render user info without repeating Discord lookups

## Authorization policy (guild + roles)

Requirements:
- **Must be in guild**: if not, deny access (and show a helpful error page)
- **Must have roles**: configurable via env, e.g.:
  - `OFFNOMDISCORD_GUILD_ID`
  - `ROLE_ID_*` (one env var per allowed role snowflake; web portal reads all `ROLE_ID_` prefixes)

Role-check strategy:
- default to “must have at least one allowed role”
- optionally support per-route role requirements (e.g. admin-only)

## Data needed from Discord

To support the above, we need:
- guild id (server)
- member fetch capability (requires bot permission and appropriate intents/config)
- role ids for required roles

We should prefer storing role **ids** rather than names (names change).

## Failure modes and UX

Discord lookups can fail (network, permissions, rate limits).

Policy:
- If we cannot verify membership/roles for a protected route, fail closed (deny) with a friendly error.
- If we cannot fetch avatar/display name but authorization is satisfied, degrade gracefully:
  - show a placeholder avatar
  - show `discordId` or a cached/stale name

## Notes / future expansions

- Persisting profile snapshots in Postgres may be worthwhile later (auditability + less cold-start pain).
- If we add webhook-driven updates (e.g. on member update events), we can keep profile data fresher with fewer polls.

