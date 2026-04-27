import type { ColorScheme, ThemePreference } from "../../middleware/theme-preference";
import { PreferencesForm } from "../../shared/components/preferences-form";
import { DiscordButton } from "./components/discord-button";

export type LoginPageProps = {
  /** Post-login destination (path only, validated). */
  returnTo: string;
  theme: ThemePreference;
  colorScheme: ColorScheme;
};

/** Body content for `GET /login`; document shell comes from {@link PageLayout} in the handler. */
export function LoginPage(props: LoginPageProps): JSX.Element {
  return (
    <div class="[ center ]">
      <div class="[ stack ] [ screen-element ]">

        <h1>Sign in</h1>
        <p>
          NDB2 uses Discord to verify your identity. Continue to Discord when you are ready.
        </p>
        <p>Users of NDB2 must be paying members of the Off-Nominal Discord.</p>
        <p>
          <DiscordButton returnTo={props.returnTo} />
        </p>
        <PreferencesForm theme={props.theme} colorScheme={props.colorScheme} />
      </div>
    </div>
  );
}
