import { Suspense } from "@kitajs/html/suspense";
import { HtmlHead } from "../../../shared/components/html_head";
import { PageLayout } from "../../../shared/components/page_layout";
import { clientScriptsForModule } from "../../../shared/clientScriptsForModule";
import type { ThemePreference } from "../../../middleware/theme-preference";
import { DelayedSnippet } from "./components/delayed_snippet";

export type SuspenseDemoPageProps = {
  /** Request id from {@link renderToStream}; required on every `Suspense` boundary. */
  rid: number | string;
  theme: ThemePreference;
};

/**
 * Full-page demo for Kita `Suspense` + `renderToStream` (chunked HTML + inline
 * `SuspenseScript`). See https://html.kitajs.org/guide/introduction#async-components-and-suspense
 */
export function SuspenseDemoPage(props: SuspenseDemoPageProps): JSX.Element {
  return (
    <html lang="en" data-theme={props.theme}>
      <head>
        <HtmlHead
          title="Suspense streaming (Kita Html)"
          clientScripts={clientScriptsForModule(__filename)}
        />
      </head>
      <body>
        <PageLayout>
          <>
            <p>
              <a href="/">← Home</a>
            </p>

            <h1>Async + Suspense streaming</h1>
            <p>
              Two independent boundaries share the same request id. Each shows a fallback
              immediately, then swaps to the resolved content when the async work finishes.
            </p>

            <section aria-labelledby="suspense-a">
              <h2 id="suspense-a">Boundary A (shorter delay)</h2>
              <Suspense
                rid={props.rid}
                fallback={
                  <p class="suspense-fallback">
                    Loading block A…
                  </p>
                }
              >
                {DelayedSnippet({ delayMs: 750, label: "A" })}
              </Suspense>
            </section>

            <section aria-labelledby="suspense-b">
              <h2 id="suspense-b">Boundary B (longer delay)</h2>
              <Suspense
                rid={props.rid}
                fallback={
                  <p class="suspense-fallback">
                    Loading block B…
                  </p>
                }
              >
                {DelayedSnippet({ delayMs: 1750, label: "B" })}
              </Suspense>
            </section>
          </>
        </PageLayout>
      </body>
    </html>
  );
}
