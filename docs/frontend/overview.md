# Frontend overview (ndb2)

## Objectives

This project will add a new web dashboard for users to interact with Nostradambot2 (ndb2).

- **Create a new dashboard** for users to view and work with ndb2 data and workflows.
- **Replace the old site** (Next.js + Tailwind) which doesn’t meet current needs.
- **Expand functionality** beyond what the old site supported.

## Stack (initial constraints)

The frontend will be server-rendered and progressively enhanced.

- **Server rendering**: EJS templates
- **Interactivity**: HTMX (progressive enhancement; minimal bespoke JS)
- **Styling**: Custom “Cube CSS” framework (project-specific conventions)

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

- **Auth/session model**: shared with API or separate frontend session? (cookie/session vs JWT)
- **Routing**: URL structure and how it maps to EJS views/partials.
- **Cube CSS specifics**: token naming, layout primitives, component conventions.
- **Build/deploy**: where the frontend server runs relative to the API (same Express app vs separate service).

