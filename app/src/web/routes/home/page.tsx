import type { WebAuthAuthenticated } from "../../middleware/auth/session";
import { HeadingScreenElement } from "@web/shared/components/heading-screen-element";

export type HomePageProps = {
  auth: WebAuthAuthenticated;
};

/** Body content for `/` (Kitajs HTML JSX → string); document shell is {@link AuthenticatedPageLayout} in the handler. */
export function HomePage(props: HomePageProps): JSX.Element {
  return (
    <>
      <HeadingScreenElement>
        <h1>Main Menu</h1>
      </HeadingScreenElement>


      <p>
        Signed in as Discord user <code>{props.auth.discordId}</code>. Have a nice day.
      </p>
    </>
  );
}
