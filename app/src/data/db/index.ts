import { config } from "@config";
import pg from "pg";

let pool: pg.Pool | null = null;

/** Stable per-method bindings so repeated reads return the same function reference */
const boundMethodCache = new Map<string | symbol, unknown>();

/**
 * Proxy target: `vi.spyOn(pool, "connect")` defines `connect` here. The `get` trap
 * must read from this object first or the spy is never invoked.
 */
const poolProxyTarget = {} as pg.Pool;

function createPool(): pg.Pool {
  /** Prefer live `process.env` so integration tests can swap `DATABASE_URL` after {@link resetPoolForTests}. */
  const url = process.env.DATABASE_URL ?? config.database.url;
  return new pg.Pool({
    connectionString: url,
    max: config.database.poolMax,
  });
}

/** Lazily created so integration tests can set DATABASE_URL before first use. */
export default new Proxy(poolProxyTarget, {
  get(target, prop, receiver) {
    if (Reflect.getOwnPropertyDescriptor(target, prop) !== undefined) {
      return Reflect.get(target, prop, receiver);
    }
    if (!pool) {
      pool = createPool();
    }
    const value = Reflect.get(pool, prop, pool);
    if (typeof value === "function") {
      if (!boundMethodCache.has(prop)) {
        boundMethodCache.set(prop, value.bind(pool));
      }
      return boundMethodCache.get(prop);
    }
    return value;
  },
  has(target, prop) {
    if (Reflect.has(target, prop)) {
      return true;
    }
    if (!pool) {
      pool = createPool();
    }
    return prop in pool;
  },
  getOwnPropertyDescriptor(target, prop) {
    const own = Reflect.getOwnPropertyDescriptor(target, prop);
    if (own) {
      return own;
    }
    if (!pool) {
      pool = createPool();
    }
    return Object.getOwnPropertyDescriptor(pool, prop);
  },
  defineProperty(target, prop, attributes) {
    return Reflect.defineProperty(target, prop, attributes);
  },
}) as pg.Pool;

/**
 * Closes the pool and clears the singleton so the next access uses the current
 * DATABASE_URL (used by ephemeral database tests).
 */
export async function resetPoolForTests(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
  boundMethodCache.clear();
}
