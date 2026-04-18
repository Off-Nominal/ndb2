# Authentication (Discord OAuth2)

**Status:** Specification only. The web app does not yet implement `/auth/discord`, sessions, or route guards; the HTML surface is currently public.

All ndb2 users must have a Discord account. We do **not** manage passwords or identity ourselves.

Instead, we use **Discord OAuth2** as the only authentication mechanism, and map Discord’s user id (“snowflake”) to our internal `users` record.

Reference: Discord OAuth2 docs (`https://docs.discord.com/developers/topics/oauth2`).

## Identity model

- **Discord identity**: `discord_id` (Discord user id; numeric string “snowflake”)
- **Internal identity**: `users.id` (UUID)

Rule:
- After OAuth completes, we look up `users` by `discord_id`.
  - If found: that row’s `id` becomes the authenticated user id.
  - If not found: create a new user row with that `discord_id` and use the new UUID.

## OAuth2 flow (Authorization Code)

We will implement the standard **authorization code** flow:

1. User clicks “Sign in with Discord”
2. Browser is redirected to Discord’s authorize URL with:
   - `client_id`
   - `redirect_uri`
   - `response_type=code`
   - `scope` (minimum: `identify`)
   - `state` (random nonce to prevent CSRF)
3. Discord redirects back to our callback with `code` + `state`
4. Server exchanges `code` for an access token via Discord’s token endpoint
5. Server calls Discord’s “Get Current User” endpoint to retrieve the user id
6. Server resolves/creates a local `users` row and establishes a session
7. Browser is redirected to the originally requested page (or a default dashboard)

Notes:
- We should store the “return to” URL in a short-lived server-side state record, keyed by `state`.
- Scopes should be kept minimal; `identify` is typically sufficient to get the Discord user id.

## Web app endpoints (proposed)

Under `app/src/web/routes`:

- `GET /auth/discord`
  - generates a `state` value
  - stores `{ state, returnTo, expiresAt }`
  - redirects to Discord authorize URL

- `GET /auth/discord/callback`
  - validates `state`
  - exchanges `code` for token
  - fetches Discord user (`/users/@me`)
  - upserts/loads local user by `discord_id`
  - creates a session + sets cookie
  - redirects to `returnTo`

- `POST /auth/logout`
  - revokes the session server-side
  - clears the cookie
  - redirects to a logged-out landing page

## Session storage + cookies (minimal dependencies)

Because the frontend is server-rendered, the simplest, most secure approach is a **server-side session** with an **opaque session id** stored in an `HttpOnly` cookie.

### Recommended approach

- Create a `sessions` table (or similar) in Postgres with fields like:
  - `id` (random UUID or random 32+ bytes, base64url)
  - `user_id` (UUID FK → `users.id`)
  - `created_at`, `expires_at`
  - `revoked_at` (nullable)
  - optional: `last_seen_at`, `ip_hash`, `user_agent_hash` (defense-in-depth)

- Cookie value: `ndb2_session=<opaque_session_id>`
  - cookie contains **no PII** and no Discord ids
  - session lookup happens server-side on each request

This keeps custom code small and avoids dependencies like Passport/session stores.

### Cookie settings (recommended defaults)

Set the session cookie with:
- `HttpOnly`: true (prevents JS from reading it)
- `Secure`: true in production (HTTPS only)
- `SameSite`: `Lax` (works with typical OAuth redirect flows; reduces CSRF risk)
- `Path`: `/`
- `Max-Age` / `Expires`: match session expiry (e.g. 7–30 days depending on desired UX)

If the site is served over multiple subdomains, set `Domain` deliberately; otherwise omit it.

### Cookie signing

For now, **skip signing** and keep the cookie value purely opaque. (We can add signing later if needed.)

## Authorization (protecting routes)

For `app/src/web`:
- Add an auth middleware that:
  - reads `ndb2_session` cookie
  - loads the session record
  - resolves the internal `userId` (UUID) and `discordId` (Discord snowflake)
  - redirects to `/auth/discord` when missing/invalid

### Request-scoped auth context (AsyncLocalStorage)

Prefer not to mutate `req` with additional fields. Instead, use Node’s `AsyncLocalStorage` to store an auth context that is accessible throughout the request lifecycle.

Recommended stored values:
- `userId` (internal UUID)
- `discordId` (Discord snowflake)

This gives route handlers and Kitajs page rendering a consistent way to access auth without fighting Express request typing or custom validation types.

For `app/src/api/v2`:
v2 remains **API-key only**; no session cookie support is required.

If the web UI calls the DB/services directly (preferred), it may not need to call v2 at all for most page loads.

## CSRF considerations (HTMX)

Even with `SameSite=Lax`, we should plan for CSRF on state-changing requests:
- Use `POST`/`PATCH`/`DELETE` for mutations
- Implement a synchronizer-token CSRF scheme with **small custom code** (no dependency required):
  - Generate a random CSRF token **per session** (or periodically rotate) and store it server-side (e.g. on the session record).
  - Render the CSRF token into HTML as either:
    - a `<meta name="csrf-token" content="...">`, and/or
    - a hidden `<input>` included in forms.
  - Ensure HTMX sends the token on every state-changing request, preferably as a header:
    - `X-CSRF-Token: <token>`
  - Validate on the server for all non-idempotent routes (POST/PATCH/DELETE).

Practical HTMX patterns:
- Set a global `hx-headers` on a top-level wrapper element (or shared layout page component) so HTMX-driven requests inherit it.
- For standard form posts, include a hidden input and copy it to a header (or validate from form body).

## Error handling + UX

OAuth can fail for many reasons (user cancels, token exchange fails, state mismatch).
On failure:
- clear any partial state
- show a simple error page with a “Try again” link to `/auth/discord`

