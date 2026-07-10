export type ReadinessState = {
  ready: boolean;
  error: string | null;
};

let state: ReadinessState = {
  ready: false,
  error: null,
};

export function getReadiness(): ReadinessState {
  return state;
}

export function markReady(): void {
  state = { ready: true, error: null };
}

export function markStartupFailed(message: string): void {
  state = { ready: false, error: message };
}

/** Resets readiness (tests). */
export function resetReadinessForTests(): void {
  state = { ready: false, error: null };
}
