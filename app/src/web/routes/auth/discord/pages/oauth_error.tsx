import { html_head } from "../../../../shared/components/html_head";

export type oauth_error_page_props = {
  title: string;
  message: string;
};

/** Shown when OAuth fails (state mismatch, token error, user cancelled, etc.). */
export function oauth_error_page(props: oauth_error_page_props): JSX.Element {
  return (
    <html lang="en">
      <head>{html_head({ title: props.title })}</head>
      <body>
        <main>
          <h1>{props.title}</h1>
          <p>{props.message}</p>
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
