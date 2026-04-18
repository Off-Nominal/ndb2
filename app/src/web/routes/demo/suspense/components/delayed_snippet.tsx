/** Async child for `Suspense` demos (simulated slow server work). */
export async function delayed_snippet(props: {
  delayMs: number;
  label: string;
}): Promise<string> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, props.delayMs);
  });

  return (
    <div class="suspense-loaded" data-label={props.label}>
      <p>
        <strong>{props.label}</strong> resolved after{" "}
        <span class="delay-ms">{props.delayMs}</span> ms.
      </p>
      <p class="hint">
        With chunked encoding, the fallback was sent first; this block replaced it when
        ready (see Network tab: streamed response).
      </p>
    </div>
  );
}
