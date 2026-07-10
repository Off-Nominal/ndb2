import { createLogger } from "@mendahu/utilities";
import pool from "./index";

const logger = createLogger({ namespace: "NDB2/DB", env: ["dev", "production"] });

export type WaitForDatabaseOptions = {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatConnectionError(err: unknown): string {
  if (err instanceof Error) {
    const pgCode =
      "code" in err && typeof err.code === "string" ? ` [${err.code}]` : "";
    return `${err.message}${pgCode}`;
  }
  return String(err);
}

/**
 * Verifies Postgres is reachable before bootstrapping the app. Retries with
 * exponential backoff so a container restart can outlive a brief DB outage.
 */
export async function waitForDatabase(
  options: WaitForDatabaseOptions = {},
): Promise<void> {
  const maxAttempts = options.maxAttempts ?? 30;
  const initialDelayMs = options.initialDelayMs ?? 1_000;
  const maxDelayMs = options.maxDelayMs ?? 10_000;

  let delayMs = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const client = await pool.connect();
      client.release();
      if (attempt > 1) {
        logger.log(`Database connection verified on attempt ${attempt}/${maxAttempts}`);
      }
      return;
    } catch (err) {
      const detail = formatConnectionError(err);

      if (attempt === maxAttempts) {
        throw new Error(
          `Database unavailable after ${maxAttempts} attempts (last error: ${detail})`,
        );
      }

      logger.error(
        `Database connection failed (attempt ${attempt}/${maxAttempts}): ${detail}. Retrying in ${delayMs}ms…`,
      );
      await sleep(delayMs);
      delayMs = Math.min(delayMs * 2, maxDelayMs);
    }
  }
}
