import { html_head } from "../../shared/components/html_head";

export type home_page_props = {
  title: string;
  message: string;
};

/** Full HTML document for `/` (Kitajs HTML JSX → string). */
export function home_page(props: home_page_props): JSX.Element {
  return (
    <html lang="en">
      <head>{html_head({ title: props.title })}</head>
      <body>
        <p>{props.message}</p>

        <p>
          <a href="/demo/suspense">Suspense streaming demo</a> (async Kita Html + chunked
          response)
        </p>

        <section aria-labelledby="htmx-demo-heading">
          <h2 id="htmx-demo-heading">HTMX + Kitajs</h2>
          <p>
            <button
              type="button"
              hx-get="/home/lucky-number"
              hx-target="#lucky-result"
              hx-swap="innerHTML"
            >
              Get a random number
            </button>
          </p>
          <p>
            Result:{" "}
            <span id="lucky-result" aria-live="polite">
              —
            </span>
          </p>
        </section>
      </body>
    </html>
  );
}
