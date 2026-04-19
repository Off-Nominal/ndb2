import { html_head } from "./html_head";
import type { ThemePreference } from "../../middleware/theme-preference";

export type error_page_body = string | JSX.Element;

function render_body(body: error_page_body): JSX.Element {
  return typeof body === "string" ? <p>{body}</p> : body;
}

export type error_page_props = {
  title: string;
  theme: ThemePreference;
  /** Plain text (wrapped in `<p>`) or a Kitajs fragment. */
  body: error_page_body;
};

/** Full HTML document for user-facing error states (4xx/5xx, OAuth, 404, etc.). */
export function error_page(props: error_page_props): JSX.Element {
  return (
    <html lang="en" data-theme={props.theme}>
      <head>{html_head({ title: props.title })}</head>
      <body>
        <main>
          <h1>{props.title}</h1>
          {render_body(props.body)}
          <p>
            <a href="/login?returnTo=%2F">Try again</a>
          </p>
          <p>
            <a href="/">Home</a>
          </p>
        </main>
      </body>
    </html>
  );
}

export type error_htmx_snippet_props = {
  title?: string;
  body?: error_page_body;
};

/** Minimal HTML for HTMX responses (fragments, alerts). */
export function error_htmx_snippet(
  props: error_htmx_snippet_props = {},
): JSX.Element {
  const title = props.title ?? "Something went wrong";
  const body = props.body ?? "Please try again in a moment.";
  return (
    <div role="alert">
      <p>{title}</p>
      {render_body(body)}
      <p>
        <a href="/">Return home</a> or reload the page.
      </p>
    </div>
  );
}
