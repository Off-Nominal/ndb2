# Route map (web)

This document describes the initial set of web routes served by `app/src/web`.

**Status:** **`/`** (welcome + HTMX lucky-number demo), **`GET /home/lucky-number`** (HTML component for HTMX), and **`GET /demo/suspense`** (Kitajs **`Suspense`** + **`renderToStream`**) are implemented. The sections below describe the **target** product routes; auth behavior is not enforced until Discord sessions exist.

Conventions:

- Pages are server-rendered (**Kitajs HTML** `.tsx` → HTML string or chunked stream) and may use HTMX for targeted updates.
- Where a page has rich interactions (filters, pagination, inline actions), expect additional **component** routes (small HTML responses) under the same feature prefix (e.g. `/predictions/...`).

## Routes

### `/`

**Current:** welcome copy, link to the Suspense streaming demo, HTMX button that loads `/home/lucky-number`.

**Target:** landing page dashboard featuring:

- leaderboard for the current season
- summary of current season stats
- summary of the logged-in user’s stats

Auth: **requires login** (otherwise redirect to `/auth/discord` or show a limited public view—TBD).

### `/demo/suspense`

**Current:** demo page only — two independent **`Suspense`** boundaries with artificial delays; response is **streamed** (`renderToStream` → `res`). Not a product route.

### `/home/lucky-number`

**Current:** HTMX-oriented HTML **component** response (random number in a `<span>`), colocated with `routes/home/`. Not a product route.

### `/predictions`

Searchable/filterable list of predictions.

Auth: **requires login**.

### `/predictions/:id`

Individual prediction view with stats and related context (bets/votes/etc as applicable).

Auth: **requires login**.

### `/seasons`

List of seasons with summaries and links.

Auth: **requires login** (can be made public later if desired).

### `/seasons/:id`

Individual season view with stats, notable predictions, and aggregates.

Auth: **requires login** (can be made public later if desired).

### `/users/:id`

Individual user view with stats.

Auth: **requires login**; visible to any authenticated user (not just the user themselves).

### `/profile`

Logged-in user profile/preferences page.

Initial scope:
- light/dark mode selector

Auth: **requires login**.
