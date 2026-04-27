import fs from "fs";
import path from "path";

/** `app/` package root — works from `src/data/legacy-queries` (tsx) or `dist/data/legacy-queries` (compiled). */
function packageRootFromLegacyQueriesDir(): string {
  return path.join(__dirname, "..", "..", "..");
}

function resolveLegacySqlDir(): string {
  const besideModule = path.join(__dirname, "sql");
  if (fs.existsSync(besideModule)) {
    return besideModule;
  }
  const fromDist = path.join(
    packageRootFromLegacyQueriesDir(),
    "dist",
    "data",
    "legacy-queries",
    "sql",
  );
  if (fs.existsSync(fromDist)) {
    return fromDist;
  }
  throw new Error(
    "Legacy SQL bundle missing. From the `app` package, run: pnpm run transfer-queries " +
      "(or `pnpm run build` / `pnpm run compile:dev`) so `dist/data/legacy-queries/sql` exists.",
  );
}

class SqlFileLoader {
  private readonly sqlDir: string;
  private queries: Record<string, string> = {};

  constructor() {
    this.sqlDir = resolveLegacySqlDir();
    const files = this.getFiles();
    this.mapFilesToQueries(files);
  }

  private getFiles() {
    return fs.readdirSync(this.sqlDir);
  }

  private mapFilesToQueries(files: string[]) {
    for (const file of files) {
      if (!file.endsWith(".sql")) {
        continue;
      }

      const key = file.replace(".sql", "");
      const query = fs.readFileSync(path.join(this.sqlDir, file), "utf-8");
      this.queries[key] = query;
    }
  }

  public get(key: string): string {
    return this.queries[key];
  }
}

const sqlFileLoader = new SqlFileLoader();

export default sqlFileLoader;
