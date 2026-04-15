import { Client } from "pg";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomBytes } from "node:crypto";

/** api package root (parent of `src` / `dist`), so migrations resolve in both vitest and compiled runs */
const apiRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

/** Schema-only template cloned for each integration test file. */
export const TEST_TEMPLATE_DB = "ndb2_test_schema_template";

export function schemaSqlPath(): string {
  return path.resolve(apiRoot, "../db/schema.sql");
}

/**
 * Full baseline schema (dbmate dump). Migrations alone are not sufficient: early
 * migrations are empty and later ones ALTER existing tables.
 */
function loadFilteredSchemaSql(): string {
  const raw = readFileSync(schemaSqlPath(), "utf8");
  return raw
    .split(/\r?\n/)
    .filter((line) => {
      const t = line.trim();
      if (t.startsWith("\\restrict") || t.startsWith("\\unrestrict")) {
        return false;
      }
      // pg_dump 18+ may emit this; Postgres 16 (e.g. CI Docker image) has no such GUC
      if (/^SET\s+transaction_timeout\s*=/i.test(t)) {
        return false;
      }
      return true;
    })
    .join("\n");
}

export function getPostgresInstanceUrl(databaseUrl: string): string {
  const u = new URL(databaseUrl);
  u.pathname = "/postgres";
  return u.toString();
}

export function databaseUrlWithName(
  baseDatabaseUrl: string,
  databaseName: string
): string {
  const u = new URL(baseDatabaseUrl);
  u.pathname = `/${databaseName}`;
  return u.toString();
}

async function terminateConnections(
  admin: Client,
  databaseName: string
): Promise<void> {
  await admin.query(
    `
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = $1 AND pid <> pg_backend_pid()
  `,
    [databaseName]
  );
}

export async function dropDatabaseIfExists(
  admin: Client,
  databaseName: string
): Promise<void> {
  await terminateConnections(admin, databaseName);
  await admin.query(`DROP DATABASE IF EXISTS "${databaseName.replace(/"/g, '""')}"`);
}

/**
 * Applies `db/schema.sql` to an empty database (same source as dev `start-db.sh`).
 * Prefer `psql` when available (CI); fall back to a single pg query for environments
 * without the client binary.
 */
export async function applySchemaSql(databaseUrl: string): Promise<void> {
  const sql = loadFilteredSchemaSql();
  try {
    execFileSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1"], {
      input: sql,
      stdio: ["pipe", "inherit", "inherit"],
      env: process.env,
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (err: unknown) {
    const code = err as { code?: string };
    if (code?.code !== "ENOENT") {
      throw err;
    }
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query(sql);
    } finally {
      await client.end();
    }
  }
}

/**
 * Creates an empty database, loads schema.sql, and replaces any existing template of the same name.
 */
export async function rebuildSchemaTemplate(
  baseDatabaseUrl: string
): Promise<void> {
  const adminUrl = getPostgresInstanceUrl(baseDatabaseUrl);
  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();
  try {
    await dropDatabaseIfExists(admin, TEST_TEMPLATE_DB);
    await admin.query(
      `CREATE DATABASE "${TEST_TEMPLATE_DB.replace(/"/g, '""')}"`
    );
  } finally {
    await admin.end();
  }

  const templateUrl = databaseUrlWithName(baseDatabaseUrl, TEST_TEMPLATE_DB);
  await applySchemaSql(templateUrl);
}

export function makeEphemeralDatabaseName(): string {
  const id =
    typeof process.env.VITEST_POOL_ID === "string"
      ? process.env.VITEST_POOL_ID
      : "0";
  const suffix = createHash("sha256")
    .update(`${id}:${randomBytes(16).toString("hex")}`)
    .digest("hex")
    .slice(0, 24);
  return `ndb2_test_${suffix}`;
}

export async function createDatabaseFromTemplate(
  baseDatabaseUrl: string,
  newDatabaseName: string
): Promise<void> {
  const adminUrl = getPostgresInstanceUrl(baseDatabaseUrl);
  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();
  try {
    const safeNew = newDatabaseName.replace(/"/g, '""');
    const safeTpl = TEST_TEMPLATE_DB.replace(/"/g, '""');
    await admin.query(
      `CREATE DATABASE "${safeNew}" TEMPLATE "${safeTpl}"`
    );
  } finally {
    await admin.end();
  }
}

export async function dropEphemeralDatabase(
  baseDatabaseUrl: string,
  databaseName: string
): Promise<void> {
  const adminUrl = getPostgresInstanceUrl(baseDatabaseUrl);
  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();
  try {
    await dropDatabaseIfExists(admin, databaseName);
  } finally {
    await admin.end();
  }
}
