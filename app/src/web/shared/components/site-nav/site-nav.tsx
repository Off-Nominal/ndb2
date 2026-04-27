import type { WebAuthAuthenticated } from "../../../middleware/auth/session";
import type { ColorScheme, ThemePreference } from "../../../middleware/theme-preference";
import { Button } from "../button";
import { PreferencesForm } from "../preferences-form";

export type NavigationMenuProps = {
  auth: WebAuthAuthenticated;
  theme: ThemePreference;
  colorScheme: ColorScheme;
  /** `POST /preferences` hidden `returnTo`; default `"/"`. */
  preferencesReturnTo?: string;
  /** Passed to {@link PreferencesForm} when two menus exist (e.g. `-desktop`). */
  preferencesControlIdSuffix?: string;
};

/**
 * Right-hand site nav (theme/colour, links, sign-out). Rendered by {@link AuthenticatedPageLayout} (see
 * {@link PageLayout} for unauthenticated shell with no site nav). Sign-out: POST to `/auth/logout` with CSRF.
 */
export function NavigationMenu(props: NavigationMenuProps): JSX.Element {
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
          <Button href="/seasons">Results</Button>
        </li>
        <li>
          <Button href="/profile">Profile</Button>
        </li>
      </ul>

      <div class="[ stack ]">
        <PreferencesForm
          theme={props.theme}
          colorScheme={props.colorScheme}
          returnTo={props.preferencesReturnTo ?? "/"}
          csrfToken={props.auth.csrfToken}
          controlIdSuffix={props.preferencesControlIdSuffix}
        />
        <form method="post" action="/auth/logout">
          <input type="hidden" name="_csrf" value={props.auth.csrfToken} />
          <Button type="submit">Sign out</Button>
        </form>
      </div>
    </nav>
  );
}
