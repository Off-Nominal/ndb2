import { HtmlHead } from "../../shared/components/html_head";
import { PageLayout } from "../../shared/components/page_layout";
import type { ThemePreference } from "../../middleware/theme-preference";

export type LoginPageProps = {
  /** Post-login destination (path only, validated). */
  returnTo: string;
  theme: ThemePreference;
};

/** Public sign-in screen: user clicks through to Discord OAuth. */
export function LoginPage(props: LoginPageProps): JSX.Element {
  const discordHref = `/auth/discord?${new URLSearchParams({
    returnTo: props.returnTo,
  }).toString()}`;

  return (
    <html lang="en" data-theme={props.theme}>
      <head>
        <HtmlHead title="Sign in" />
      </head>
      <body>
        <PageLayout>
          <main>
            <h1>Sign in</h1>
            <p>
              NDB2 uses Discord to verify your identity. Continue to Discord when you are
              ready.
            </p>
            <p>
              <a href={discordHref} class="login__action">
                Sign in with Discord
              </a>
            </p>
          </main>
        </PageLayout>
      </body>
    </html>
  );
}
