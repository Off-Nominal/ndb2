import type { WebAuthAuthenticated } from "../../../middleware/auth/session";
import type { ColorScheme, ThemePreference } from "../../../middleware/theme-preference";
import type { DiscordMemberProfile } from "@domain/discord";
import { Button } from "../button";
import { PreferencesForm } from "../preferences-form";

const SITE_NAV_TITLE = "Nostradambot2";

export type NavigationMenuProps = {
  auth: WebAuthAuthenticated;
  theme: ThemePreference;
  colorScheme: ColorScheme;
  /** Guild display name + avatar from discord.js cache. */
  discordProfile: DiscordMemberProfile;
  /** Suffix for control `id`s when two menus exist (e.g. `-desktop`). */
  preferencesControlIdSuffix?: string;
};

/**
 * Right-hand site nav (theme/colour, links, sign-out). Rendered by {@link AuthenticatedPageLayout} (see
 * {@link PageLayout} for unauthenticated shell with no site nav). Sign-out: POST to `/auth/logout` with CSRF;
 * theme and palette use client-side cookies (see `preferences-form.client`).
 */
export function NavigationMenu(props: NavigationMenuProps): JSX.Element {
  return (
    <nav class="[ site-nav ]">
      <div class="[ site-nav__title ]" aria-label={SITE_NAV_TITLE}>
        {SITE_NAV_TITLE.split("").map((ch) => (
          <span class="[ site-nav__title-char ]" aria-hidden="true">
            {ch}
          </span>
        ))}
      </div>
      <ul class="[ stack ] [ list-plain ]">
        <li>
          <Button class="[ full-width ]" href="/">Main Menu</Button>
        </li>
        <li>
          <Button class="[ full-width ]" href="/predictions">Predictions</Button>
        </li>
        <li>
          <Button class="[ full-width ]" href="/seasons">Results</Button>
        </li>
        <li>
          <Button class="[ full-width ]" href="/profile">Profile</Button>
        </li>
      </ul>

      <div class="[ stack ]">
        <div class="[ split-pair ]">

          <img

            src={props.discordProfile.avatarUrl}
            alt=""
            width={40}
            height={40}
            loading="lazy"
          />
          <span>{props.discordProfile.displayName}</span>
        </div>
        <PreferencesForm
          theme={props.theme}
          colorScheme={props.colorScheme}
          controlIdSuffix={props.preferencesControlIdSuffix}
        />

        <form method="post" action="/auth/logout">
          <input type="hidden" name="_csrf" value={props.auth.csrfToken} />
          <Button class="[ full-width ]" type="submit">Sign out</Button>
        </form>
      </div>
    </nav>
  );
}
