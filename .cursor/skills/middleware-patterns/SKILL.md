---
name: middleware-patterns
description: >-
  ndb2 guidance for Express middleware on the web app: prefer Node
  AsyncLocalStorage for request-scoped context instead of mutating
  Express Request. Use when adding middleware, request-scoped values, or
  refactoring handlers that set custom fields on req.
---

# Web middleware patterns (ndb2)

## Naming

Filenames under **`app/src/web/middleware/`** are **`kebab-case`**; exported middleware and helpers are **`camelCase`**. See **`middleware-naming`**.

## Prefer Async Local Storage over `req` mutations

For data that belongs to **one request** (user preference, correlation id, auth context, etc.):

- **Do:** create an `AsyncLocalStorage` store, set it in middleware with `.run(store, () => next())`, and expose a **`getThing()`** (or similar) that reads `getStore()` with a safe default when outside a request.
- **Avoid:** `declare global { namespace Express { interface Request { … } } }` and `req.myThing = …` unless you have a strong reason (e.g. interoperability with a library that only accepts `req`).

**Why:** keeps `Request` close to Express’s own shape, avoids type augmentation drift, and matches Node’s model for implicit per-request context.

**Reference implementations:**
- `app/src/web/middleware/theme-preference.ts` — `getThemePreference()` + `themePreferenceMiddleware`.
- `app/src/web/middleware/auth/` — `session.ts` (`getWebAuth()`), `require-auth.ts`, `session-cookie-utils.ts`. Import the specific modules (no barrel file).

## Handler usage

- Call **`getThemePreference()`** (or your getter) in the route handler when you need the value.
- If the handler **defers** work (streaming, callbacks scheduled outside the current stack), **read the value once synchronously** at the start of the handler and pass it into closures. Do not assume `getThemePreference()` will see the same store inside every deferred callback unless that path is known to stay on the same async resource chain (Node propagates ALS across `async`/`await` in typical Express flows, but stream internals vary).

Example: `app/src/web/routes/demo/suspense/handler.tsx` captures `const theme = getThemePreference()` before `renderToStream`.

## Middleware placement

Mount request-scoped middleware on the **web router** early (see `app/src/web/routes/index.ts` and **`express-route-map`**).

## Related

- **`express-route-map`** — `Route`, `mapRoutes`, where to mount middleware.
- **`kitajs-html-web`** — handlers, streaming, HTML responses.
