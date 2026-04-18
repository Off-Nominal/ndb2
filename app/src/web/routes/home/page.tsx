export type home_page_props = {
  title: string;
  message: string;
};

/** Full HTML document for `/` (Kitajs HTML JSX → string). */
export function home_page(props: home_page_props): JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{props.title}</title>
        <script src="/assets/htmx.min.js" defer />
      </head>
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
              attrs={{
                "hx-get": "/home/lucky-number",
                "hx-target": "#lucky-result",
                "hx-swap": "innerHTML",
              }}
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
