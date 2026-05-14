import { z } from "zod";

/**
 * HTTP query-string normalization for Zod (Express `req.query`).
 *
 * Values are typically `string | string[] | undefined`. Repeated keys yield arrays;
 * missing or empty keys often arrive as `""`. These helpers normalize that wire shape before inner
 * schemas run — shared by v2 JSON routes and Kitajs HTML handlers (same Express stack).
 */

/**
 * Normalizes raw Express `req.query` values for a single logical parameter:
 * `undefined`, `null`, and `""` become `undefined`; arrays use the first element
 * (repeated keys in the query string); other values pass through unchanged.
 */
export function preprocessQueryStringScalar(value: unknown): unknown {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Wraps a Zod schema so it receives the result of {@link preprocessQueryStringScalar}.
 */
export function queryParamScalar<Schema extends z.ZodTypeAny>(schema: Schema) {
  return z.preprocess(preprocessQueryStringScalar, schema);
}

/**
 * Normalizes raw query values that may be repeated: `undefined` / `null` / `""`
 * become `undefined`; a single string becomes a one-element array; string arrays pass through.
 */
export function preprocessQueryStringMulti(value: unknown): unknown {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }
  return Array.isArray(value) ? value : [value];
}

/**
 * Wraps a Zod schema so it receives the result of {@link preprocessQueryStringMulti}.
 */
export function queryParamMulti<Schema extends z.ZodTypeAny>(schema: Schema) {
  return z.preprocess(preprocessQueryStringMulti, schema);
}

/**
 * Optional string that trims; `undefined`, `""`, or whitespace-only after trim becomes `undefined`.
 * Use with {@link queryParamScalar} so blank query params behave as omitted.
 */
export const optionalTrimmedStringSchema = z
  .string()
  .optional()
  .transform((s) => {
    if (s === undefined) return undefined;
    const t = s.trim();
    return t === "" ? undefined : t;
  });
