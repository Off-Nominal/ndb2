import { HtmlHead } from "./html_head";
import { PageLayout } from "./page_layout";
import type { ThemePreference } from "../../middleware/theme-preference";

export type ErrorPageBody = string | JSX.Element;

function renderBody(body: ErrorPageBody): JSX.Element {
  return typeof body === "string" ? <p>{body}</p> : body;
}

export type ErrorPageProps = {
  title: string;
  theme: ThemePreference;
  /** Plain text (wrapped in `<p>`) or a Kitajs fragment. */
  body: ErrorPageBody;
};

/** Full HTML document for user-facing error states (4xx/5xx, OAuth, 404, etc.). */
export function ErrorPage(props: ErrorPageProps): JSX.Element {
  return (
    <html lang="en" data-theme={props.theme}>
      <head>
        <HtmlHead title={props.title} />
      </head>
      <body>
        <PageLayout>
          <main>
            <h1>{props.title}</h1>
            {renderBody(props.body)}
            <p>
              <a href="/login?returnTo=%2F">Try again</a>
            </p>
            <p>
              <a href="/">Home</a>
            </p>
          </main>
        </PageLayout>
      </body>
    </html>
  );
}

export type ErrorHtmxSnippetProps = {
  title?: string;
  body?: ErrorPageBody;
};

/** Minimal HTML for HTMX responses (fragments, alerts). */
export function ErrorHtmxSnippet(props: ErrorHtmxSnippetProps = {}): JSX.Element {
  const title = props.title ?? "Something went wrong";
  const body = props.body ?? "Please try again in a moment.";
  return (
    <div role="alert">
      <p>{title}</p>
      {renderBody(body)}
      <p>
        <a href="/">Return home</a> or reload the page.
      </p>
    </div>
  );
}
