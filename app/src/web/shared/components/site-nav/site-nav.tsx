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
};

/**
 * Default site links for the right-hand nav column (theme/colour + links + sign-out). For a custom list, pass
 * it as the `navigation` prop on {@link AuthenticatedPageLayout} ({@link PageLayout} is main-only and has no
 * site nav). Sign-out: POST to `/auth/logout` with the session CSRF token.
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
          <Button href="/seasons">Seasons</Button>
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
        />
        <form method="post" action="/auth/logout">
          <input type="hidden" name="_csrf" value={props.auth.csrfToken} />
          <Button type="submit">Sign out</Button>
        </form>
      </div>
    </nav>
  );
}
