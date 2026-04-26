import type { WebAuthAuthenticated } from "../../middleware/auth/session";
import { Button } from "./button";

export type DefaultSiteNavProps = {
  auth: WebAuthAuthenticated;
};

/**
 * Default site links for the right-hand nav column. For a custom list, pass it as the `navigation` prop
 * on {@link AuthenticatedPageLayout} ({@link PageLayout} is main-only and has no site nav).
 * Logout matches the home page: POST to `/auth/logout` with the session CSRF token.
 */
export function DefaultSiteNav(props: DefaultSiteNavProps): JSX.Element {
  return (
    <nav class="[ site-nav ]">
      <ul class="[ stack ] [ list-plain ]">
        <li>
          <Button href="/">Main Menu</Button>
        </li>
        <li>
          <Button href="/predictions">Predictions</Button>
        </li>
        <li>
          <Button href="/seasons">Seasons</Button>
        </li>
      </ul>
      <div>
        <form method="post" action="/auth/logout">
          <input type="hidden" name="_csrf" value={props.auth.csrfToken} />
          <Button type="submit">Sign out</Button>
        </form>
      </div>
    </nav>
  );
}
