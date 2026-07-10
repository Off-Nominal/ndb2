/**
 * Unconditional stderr logging for container boot diagnostics. Do not route
 * through createLogger — @mendahu/utilities only emits when NODE_ENV matches
 * the logger's env list (e.g. "production"), so Coolify hosts that leave
 * NODE_ENV unset would otherwise show no output before exit.
 */
export function logStartup(message: string, detail?: unknown): void {
  if (detail === undefined) {
    console.error(`[NDB2] ${message}`);
    return;
  }
  console.error(`[NDB2] ${message}`, detail);
}

export function logStartupError(label: string, err: unknown): void {
  if (err instanceof Error) {
    console.error(`[NDB2] ${label}: ${err.message}`);
    if (err.stack) {
      console.error(err.stack);
    }
    return;
  }
  console.error(`[NDB2] ${label}:`, err);
}
