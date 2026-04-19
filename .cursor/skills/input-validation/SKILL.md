---
name: input-validation
description: >-
  Prefer Zod for runtime validation of env vars, HTTP inputs, and parsed external data.
  Instructs checking the installed library version (e.g. Zod 3 vs 4) and matching official
  docs and examples to that version so APIs are not outdated or deprecated. Use when adding
  validation, parsing request bodies or query strings, validating environment configuration,
  or refactoring manual checks into schemas.
---

# Input validation (Zod + version alignment)

## Default: use Zod

For **runtime** validation in TypeScript (not compile-time types alone), prefer **[Zod](https://zod.dev/)** when the project already depends on it:

- Environment variables and feature flags
- Request bodies, query params, route params, and headers (compose with existing HTTP handlers)
- JSON or structured payloads from external APIs before use in application code
- Normalizing stringly-typed values (e.g. `"48"` → positive number) with clear failure modes

Use `safeParse` when invalid input should yield a controlled branch (fallback, 400, etc.); use `parse` when invalid input should throw after you intend to fail fast.

Pair Zod output types with TypeScript via `z.infer<typeof schema>` where it reduces duplication.

## Match documentation to the installed version (required)

Zod’s public API **changes across major versions** (e.g. Zod 3 vs Zod 4). Training data and generic web examples often target an older major. **Do not** copy patterns from memory or random search results without confirming they apply to **this** repo’s Zod.

**Before writing or changing Zod code:**

1. **Read the installed version** from the relevant `package.json` (e.g. `app/package.json` → `"zod": "^4.x"` or the resolved version in the lockfile if you need exact patch).
2. **Use docs for that major version** — e.g. official site paths or release notes for v3 vs v4. If using web search, include the major version in the query (e.g. “Zod 4 coerce number”).
3. **Prefer the local contract of truth**: if unsure whether a method exists (e.g. chaining helpers, `z.coerce`, refinements), check **`node_modules/zod`** typings or the package’s README/changelog for the installed version instead of guessing.
4. **Avoid deprecated or removed APIs** — if a snippet uses an old API, find the current equivalent under the correct major version rather than pasting legacy code.

If the repo upgrades Zod, re-validate existing schemas against the new major’s migration notes; do not assume drop-in compatibility.

## Project touchpoints

- **`app/package.json`** — declares `zod`; use that version when reasoning about APIs.
- **App-wide environment variables** — validated once at boot in `app/src/config.ts`; see `.cursor/skills/app-config/SKILL.md`.
- Colocate small schemas next to the feature or under a shared `schemas/` module if the project establishes one; follow existing import and naming patterns.

## What not to do

- Do not introduce a second validation library for the same layer without an explicit product decision.
- Do not validate with ad-hoc `Number(x)` / regex only when a schema would encode the rules and errors more clearly—unless the project already uses a different pattern in that file.

## Quick checklist

- [ ] Confirmed **Zod major version** from `package.json` (or lockfile).
- [ ] Examples and method names match **that** major’s documentation or local typings.
- [ ] Invalid input paths tested or handled (`safeParse`, fallbacks, HTTP errors) as appropriate.
