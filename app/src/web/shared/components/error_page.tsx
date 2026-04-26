export type ErrorPageBody = string | JSX.Element;

function renderBody(body: ErrorPageBody): JSX.Element {
  return typeof body === "string" ? <p>{body}</p> : body;
}

export type ErrorPageProps = {
  title: string;
  /** Plain text (wrapped in `<p>`) or a Kitajs fragment. */
  body: ErrorPageBody;
};

/** Main column content for user-facing error states (4xx/5xx, OAuth, 404). Wrap with {@link PageLayout} (no site nav) or, for the signed-in shell, {@link AuthenticatedPageLayout} (requires `auth` for the default nav). */
export function ErrorPage(props: ErrorPageProps): JSX.Element {
  return (
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
