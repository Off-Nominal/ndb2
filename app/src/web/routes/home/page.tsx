import type { WebAuthAuthenticated } from "../../middleware/auth/session";
import { getThemePreference } from "../../middleware/theme-preference";

export type HomePageProps = {
  message: string;
  auth: WebAuthAuthenticated;
};

/** Body content for `/` (Kitajs HTML JSX → string); document shell comes from {@link PageLayout} in the handler. */
export function HomePage(props: HomePageProps): JSX.Element {
  const theme = getThemePreference();
  return (
    <>
      <div class="theme-switcher">
        <label for="theme-select">Appearance</label>
        <select id="theme-select" aria-label="Color scheme">
          <option value="system" {...(theme === "system" ? { selected: true } : {})}>
            System
          </option>
          <option value="light" {...(theme === "light" ? { selected: true } : {})}>
            Light
          </option>
          <option value="dark" {...(theme === "dark" ? { selected: true } : {})}>
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
        <a href="/demo/suspense">Suspense streaming demo</a> (async Kita Html + chunked response)
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
    </>
  );
}
