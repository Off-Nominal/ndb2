# Results: implementation ideas

This note captures **design options** for **results** — per-user aggregates for a **season** (or **all-time**): prediction counts by status, bet outcomes, vote breakdowns, and points (awarded, penalized, net). It builds on **[`scoring.md`](scoring.md)**, **[`denormalized-data.md`](denormalized-data.md)**, and **[`game-mechanics.md`](game-mechanics.md)**.

Legacy reference: v1 leaderboards in `app/src/data/legacy-queries/scores.ts` and `app/src/api/v1/routers/scores/` (`view=points|predictions|bets`, JSON aggregation in SQL).

---

## What a “result” is

- **Concept:** an **aggregate** keyed by **`(user_id, season_scope)`**.
- **`season_scope`:** either a concrete **`seasons.id`** or an **all-time** scope (not a `seasons` row — represent in the API as **`season_id: null`**, a string like `all`, or a dedicated resource; document one convention).
- **Cardinality:** at most one logical result per **(user, season)** for users who **participated**; seasons expose one row per participating user. **All-time** is one row per user who has ever participated (or only those with activity in the chosen rules).

---

## Storage and freshness: three patterns

| Approach | Pros | Cons |
|----------|------|------|
| **Dynamic SQL** over `predictions`, `bets`, `votes` | Always matches current data; no extra migrations; aligns with how legacy queries already slice by `season_id` / `season_payout` vs `payout`. | **Global leaderboards** (rank + paginate everyone) can be expensive without strict **participation filters**, **indexes**, and careful `EXPLAIN`. |
| **Denormalized table** (e.g. `season_user_results`, PK **`(season_id, user_id)`**) | Fast reads; simple **sort + pagination** with indexes; natural **cache** for **closed** seasons when data is fixed. | **Write path:** upsert/recompute when a season **closes**, and on rare **corrections**; **all-time** still needs a defined strategy (sum of season snapshots + current tail, or separate rollups). |
| **Materialized view** | Declarative; refresh when policy allows. | **Refresh** can be heavy; “only freeze closed seasons” is often clearer with an explicit **table** + job at season close. |

**Caching:** For **closed** seasons, persisting a **snapshot** (table or one-time MV refresh) avoids recomputing the same aggregates forever. **Open** season can stay **live** or refresh on an interval. **All-time:** e.g. (a) **sum** closed-season snapshot rows + **live** query for the current open season, or (b) one **all-time** aggregate query with tight **participation** predicates.

---

## REST shape (resource-oriented)

Treat **results** as a first-class read model:

| Goal | Suggested route |
|------|------------------|
| Paginated leaderboard / all results in a season | `GET /v2/seasons/{season_id}/results?sort=&order=&page=` |
| Paginated list of seasons’ results for one user | `GET /v2/users/{user_id}/results?…` |
| Single “cell” (profile, widget) | `GET /v2/seasons/{season_id}/users/{user_id}/result` (or path order `users` → `seasons` if you prefer symmetry) |

**Query parameters (examples):**

- **`sort`** — enum aligned to metrics: `points_net`, `predictions_successful`, `bets_won`, `votes_yes`, etc.
- **`order`** — `asc` | `desc`
- **`include_all_time`** on user collections, **or** a dedicated **`GET /v2/users/{id}/result`** / **`/results/all-time`** so `seasons` semantics stay clean.

**All-time** should be explicit in the API contract (dedicated path or `season_id=all` with documented behavior).

**Types:** define a **flat** result DTO in `@offnominal/ndb2-api-types` (list + pagination meta + sort enum).

---

## SQL: readability without JSON in the database

Legacy pain is largely **`jsonb_agg` / `row_to_json`** wrapping leaderboards (see `generate_GET_LEADERBOARD_with_SEASON` in `scores.ts`). The underlying **`COUNT … FILTER (WHERE …)`** patterns are fine.

**Recommendations:**

1. **Return flat columns** from SQL (`user_id`, `discord_id`, each count, `points_awarded`, `points_penalized`, `points_net`, …). **Shape nested JSON in application code**, not in the database.
2. **Stage with CTEs** and clear names, then **`JOIN`** on `user_id`:
   - **`participants`** — users with **any** relevant activity in scope (predictions, bets, or votes). Prefer this over **`FROM users u LEFT JOIN … GROUP BY u.id`** for leaderboards when only **players** matter (avoids scanning the entire user table).
   - **`prediction_counts`**, **`bet_counts`**, **`vote_counts`**, **`point_totals`** — each **`GROUP BY user_id`** with the same **season / all-time** predicate.
   - **`final`** — join everything for one row per user.
3. **One season predicate** reused everywhere: e.g. **`predictions.season_id = :season_id`** when joining bets/votes through predictions; for points, match **[`scoring.md`](scoring.md)**: **`season_payout`** + **`bets.valid`** + **`season_applicable`** for season boards; **`payout`** for all-time.
4. **Pagination:** `ORDER BY` + `LIMIT`/`OFFSET` or **keyset** pagination on `(sort_col, user_id)`.
5. **Ranking:** `RANK() OVER (ORDER BY …)` in an outer query **or** precomputed **`rank_*`** columns in a **snapshot table** for closed seasons.

Optional: thin **`VIEW`** for the aggregate definition; keep API nesting in TypeScript.

---

## Metrics (checklist for the flat row)

Align definitions with product and triggers:

1. **Predictions** — counts by **`predictions.status`** for rows where the predictor is **`user_id`** and **`season_id`** (or anchor) matches scope.
2. **Bets** — success vs failure using **judged** prediction status + **`endorsed`** + **`bets.valid`**, same as legacy filters; season vs all-time payout columns per **`scoring.md`**.
3. **Votes** — yes/no from **`votes.vote`** (or **`enhanced_votes`**) scoped by prediction season where applicable.
4. **Points** — **`SUM`** of positive vs negative **`season_payout`** or **`payout`**, then **net**; respect **`NULL`** and invalid bets.

---

## Indexes and performance

After stubbing queries, **`EXPLAIN (ANALYZE, BUFFERS)`** on realistic volumes. Likely candidates to review (not prescriptive until measured):

- **`bets(user_id)`**, **`bets(prediction_id)`**
- **`predictions(season_id, user_id, status)`**
- **`votes(user_id, prediction_id)`**

---

## Phased delivery

1. **Define** the flat **result row** and **list response** (pagination + sort enum) in **api-types**.
2. **One PgTyped SQL** module for **single-season** scope: CTEs + **`participants`**, no JSON aggregation.
3. **Wire** `GET /seasons/:id/results` (and optionally **singleton** user row).
4. **Add** user-centric **`GET /users/:id/results`** reusing the same SQL shapes or inverted access pattern.
5. **Add** **all-time** variant (separate query or composed from season snapshots + current).
6. **Introduce** **`season_user_results`** (or MV) when **closed-season** read path needs predictable latency; **backfill** using the same SQL at **season close**.

---

## Related code

| Area | Location |
|------|----------|
| Legacy leaderboards | `app/src/data/legacy-queries/scores.ts`, `app/src/api/v1/routers/scores/` |
| v2 patterns | `.cursor/skills/v2-api-endpoints/SKILL.md`, `app/src/data/queries/` (PgTyped) |
| Scoring semantics | `docs/scoring.md` |
| Triggers / denormalized columns | `docs/denormalized-data.md` |
