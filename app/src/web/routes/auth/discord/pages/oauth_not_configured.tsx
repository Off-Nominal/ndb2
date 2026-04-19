import { html_head } from "../../../../shared/components/html_head";

/** Shown when DISCORD_OAUTH_* env vars are missing. */
export function oauth_not_configured_page(): JSX.Element {
  return (
    <html lang="en">
      <head>{html_head({ title: "Sign-in unavailable" })}</head>
      <body>
        <main>
          <h1>Sign-in unavailable</h1>
          <p>
            Discord sign-in is not configured on this server. Set DISCORD_OAUTH_CLIENT_ID,
            DISCORD_OAUTH_CLIENT_SECRET, and DISCORD_OAUTH_REDIRECT_URI.
          </p>
          <p>
            <a href="/">Home</a>
          </p>
        </main>
      </body>
    </html>
  );
}
