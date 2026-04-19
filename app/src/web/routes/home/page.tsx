import { html_head } from "../../shared/components/html_head";
import { clientScriptsForModule } from "../../shared/clientScriptsForModule";
import type { WebAuthAuthenticated } from "../../middleware/webAuthMiddleware";
import type { ThemePreference } from "../../middleware/themePreferenceMiddleware";

export type home_page_props = {
  title: string;
  message: string;
  theme: ThemePreference;
  auth: WebAuthAuthenticated;
  /** JSON for `hx-headers` (CSRF for HTMX). */
  csrfHeadersJson: string;
};

/** Full HTML document for `/` (Kitajs HTML JSX → string). */
export function home_page(props: home_page_props): JSX.Element {
  return (
    <html lang="en" data-theme={props.theme}>
      <head>
        {html_head({
          title: props.title,
          clientScripts: clientScriptsForModule(__filename),
          csrfMetaToken: props.auth.csrfToken,
        })}
      </head>
      <body hx-headers={props.csrfHeadersJson}>
        <div class="theme-switcher">
          <label for="theme-select">Appearance</label>
          <select id="theme-select" aria-label="Color scheme">
            <option
              value="system"
              {...(props.theme === "system" ? { selected: true } : {})}
            >
              System
            </option>
            <option
              value="light"
              {...(props.theme === "light" ? { selected: true } : {})}
            >
              Light
            </option>
            <option
              value="dark"
              {...(props.theme === "dark" ? { selected: true } : {})}
            >
              Dark
            </option>
          </select>
        </div>

        <p>{props.message}</p>

        <p>
          Signed in as Discord user <code>{props.auth.discordId}</code>.{" "}
          <form method="post" action="/auth/logout" style="display: inline;">
            <input type="hidden" name="_csrf" value={props.auth.csrfToken} />
            <button type="submit">Sign out</button>
          </form>
        </p>

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
