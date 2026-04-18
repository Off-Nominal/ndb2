# Frontend overview (ndb2)

## Implementation status

- **In place:** `@kitajs/html` + HTMX, `app/src/web/routes/` feature folders (`page.tsx`, `handler.ts`, `components/`), welcome page at `/`, HTMX example (`GET /home/lucky-number`), Suspense streaming demo at `/demo/suspense`, shared Express app with JSON API (`createApp` / `mountWeb` / `mountJsonApi`). See `project-structure.md` and `.cursor/skills/kitajs-html-web/SKILL.md`.
- **Not yet:** Discord session auth, dashboard pages, CUBE CSS build from tokens, most routes in `routes.md`.

## Objectives

This project will add a new web dashboard for users to interact with Nostradambot2 (ndb2).

- **Create a new dashboard** for users to view and work with ndb2 data and workflows.
- **Replace the old site** (Next.js + Tailwind) which doesn’t meet current needs.
- **Expand functionality** beyond what the old site supported.

## Stack (initial constraints)

The frontend will be server-rendered and progressively enhanced.

- **Server rendering**: Kitajs HTML (JSX/TSX → HTML strings on the server)
- **Interactivity**: HTMX (progressive enhancement; minimal bespoke JS)
- **Styling**: Custom “Cube CSS” framework (project-specific conventions)

## Templating decision

**We use Kitajs HTML for all server-rendered UI** under `app/src/web`. Earlier exploration considered a traditional Express view engine (e.g. EJS); that path is **not** adopted. UI is **typed `.tsx`** colocated with routes: **`routes/<area>/page.tsx`**, **`handler.ts`**, **`components/`** (shared pieces in `web/shared/components/` when needed), optionally streamed with Kita’s **`Suspense`** / **`renderToStream`** for slow subtrees. See `.cursor/skills/kitajs-html-web/SKILL.md` for patterns.

## Product principles (high-level)

- **Data-first UI**: optimize for scanning, filtering, and comparing (tables, time series, drill-down).
- **Minimize bespoke JS**: prefer server-rendered solutions and HTMX-driven interactions; add custom client JS only when it clearly improves UX.
- **Fast by default**: keep payloads small; avoid client bundles unless clearly justified.
- **Accessible**: keyboard navigation, visible focus, and sensible semantics on day 1.

## Scope notes

What “dashboard” includes will evolve, but the initial expectation is:

- authenticated user experience
- navigation + core pages for viewing predictions/data
- basic CRUD and admin-style workflows where applicable

## Open questions (to resolve early)

- **Auth/session model**: still to implement; plan favors cookie + server session (see `authentication.md`). v2 remains API-key only.
- **Routing**: URL map for product pages is in `routes.md`; demo routes and `/` are scaffolded—product areas will add `routes/<area>/page.tsx`, `handler.ts`, and `components/` as features land.
- **Cube CSS specifics**: token naming, layout primitives, component conventions (no generated CSS in-repo yet).
- **Build/deploy**: **resolved for dev**—same Node process serves HTML and `/api/v2`; production packaging can follow the same layout.

