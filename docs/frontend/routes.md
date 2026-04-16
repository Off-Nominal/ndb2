# Route map (web)

This document describes the initial set of web routes served by `app/src/web`.

Conventions:

- Pages are server-rendered (EJS) and may use HTMX for partial updates.
- Where a page has rich interactions (filters, pagination, inline actions), expect additional HTMX “partial” routes under the same prefix (e.g. `/predictions/_partial/...`).

## Routes

### `/`

Landing page dashboard featuring:

- leaderboard for the current season
- summary of current season stats
- summary of the logged-in user’s stats

Auth: **requires login** (otherwise redirect to `/auth/discord` or show a limited public view—TBD).

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
