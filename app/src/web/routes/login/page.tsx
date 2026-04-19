import { html_head } from "../../shared/components/html_head";
import { page_layout } from "../../shared/components/page_layout";
import type { ThemePreference } from "../../middleware/theme-preference";

export type login_page_props = {
  /** Post-login destination (path only, validated). */
  returnTo: string;
  theme: ThemePreference;
};

/** Public sign-in screen: user clicks through to Discord OAuth. */
export function login_page(props: login_page_props): JSX.Element {
  const discordHref = `/auth/discord?${new URLSearchParams({
    returnTo: props.returnTo,
  }).toString()}`;

  return (
    <html lang="en" data-theme={props.theme}>
      <head>{html_head({ title: "Sign in" })}</head>
      <body>
        {page_layout({
          children: (
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
          ),
        })}
      </body>
    </html>
  );
}
