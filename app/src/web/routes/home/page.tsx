import type { WebAuthAuthenticated } from "../../middleware/auth/session";

export type HomePageProps = {
  message: string;
  auth: WebAuthAuthenticated;
};

/** Body content for `/` (Kitajs HTML JSX → string); document shell is {@link AuthenticatedPageLayout} in the handler. */
export function HomePage(props: HomePageProps): JSX.Element {
  return (
    <>
      <p>{props.message}</p>

      <p>
        Signed in as Discord user <code>{props.auth.discordId}</code>.
      </p>
    </>
  );
}
