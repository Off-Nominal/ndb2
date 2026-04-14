import pg from "pg";

let pool: pg.Pool | null = null;

function createPool(): pg.Pool {
  return new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.PG_POOL_MAX ?? 10),
  });
}

/** Lazily created so integration tests can set DATABASE_URL before first use. */
export default new Proxy({} as pg.Pool, {
  get(_target, prop, receiver) {
    if (!pool) {
      pool = createPool();
    }
    const value = Reflect.get(pool, prop, pool);
    if (typeof value === "function") {
      return value.bind(pool);
    }
    return value;
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
}
