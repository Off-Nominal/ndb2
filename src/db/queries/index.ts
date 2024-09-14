import fs from "fs";
import path from "path";

class SqlFileLoader {
  private queries: Record<string, string> = {};

  constructor() {
    const files = this.getFiles();
    this.mapFilesToQueries(files);
  }

  private getFiles() {
    // grabs a list of all the .sql files inside the sql directory
    return fs.readdirSync(path.join(__dirname, "./sql"));
  }

  private mapFilesToQueries(files: string[]) {
    // reads the contents of each file and stores it in
    // the queries object with the file name as the key
    for (const file of files) {
      if (!file.endsWith(".sql")) {
        continue;
      }

      const key = file.replace(".sql", "");
      const query = fs.readFileSync(path.join(__dirname, "sql", file), "utf-8");
      this.queries[key] = query;
    }
  }

  public get(key: string): string {
    return this.queries[key];
  }
}

const sqlFileLoader = new SqlFileLoader();

export default sqlFileLoader;
