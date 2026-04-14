import { Client } from "pg";
import { execFileSync } from "node:child_process";
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

function migrationsDir(): string {
  return path.resolve(apiRoot, "../db/migrations");
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
 * Runs dbmate migrations against the given database URL (Node pg driver, no Docker).
 */
export function runDbmateUp(databaseUrl: string): void {
  execFileSync(
    "npx",
    ["dbmate", "--migrations-dir", migrationsDir(), "up"],
    {
      cwd: apiRoot,
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
    }
  );
}

/**
 * Creates an empty database, applies migrations, and replaces any existing template of the same name.
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
  runDbmateUp(templateUrl);
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
