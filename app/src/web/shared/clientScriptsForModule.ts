import path from "node:path";
import { clientScriptsForRouteDir } from "../generated/routeClientScripts";

/**
 * Scripts for the route folder that contains this module (e.g. `page.tsx` under
 * `routes/home/` → same keys as `clientScriptsForRouteDir("home")`).
 * Pass **`__filename`** from any module in that route folder (e.g. `page.tsx` or `handler.tsx`).
 */
export function clientScriptsForModule(moduleFilename: string): readonly string[] {
  const dir = path.dirname(moduleFilename);
  const segments = dir.split(path.sep);
  const routesIdx = segments.lastIndexOf("routes");
  if (routesIdx === -1) {
    throw new Error(
      `clientScriptsForModule: no "routes" segment in path: ${dir}`,
    );
  }
  const key = segments.slice(routesIdx + 1).join("/");
  return clientScriptsForRouteDir(key);
}
