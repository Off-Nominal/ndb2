import type { WebAuthAuthenticated } from "../../middleware/auth/session";
import { CardScreenElement } from "@web/shared/components/card-screen-element";
import { HeadingScreenElement } from "@web/shared/components/heading-screen-element";

export type HomePageProps = {
  auth: WebAuthAuthenticated;
};

/** Body content for `/` (Kitajs HTML JSX → string); document shell is {@link AuthenticatedPageLayout} in the handler. */
export function HomePage(props: HomePageProps): JSX.Element {
  return (
    <div class="[ stack ] [ main-menu ]">
      <HeadingScreenElement>
        <h1>Main Menu</h1>
      </HeadingScreenElement>

      <div class="[ grid ]">
        <CardScreenElement headingElement="h2" heading="Season">
          <p>
            Signed in as Discord user <code>{props.auth.discordId}</code>. Have a nice day.
          </p>
        </CardScreenElement>
        <CardScreenElement headingElement="h2" heading="Performance">
          <p>
            Signed in as Discord user <code>{props.auth.discordId}</code>. Have a nice day.
          </p>
        </CardScreenElement>

      </div>
    </div>
  );
}
