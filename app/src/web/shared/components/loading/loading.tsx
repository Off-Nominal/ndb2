/**
 * Neutral loading wrapper; inner **`[ loading__slot ]`** is markup-only (decorate with skeleton/spinner CSS or replace later).
 */
export function Loading(): JSX.Element {
  return (
    <span class="[ loader ]" />
  );
}
