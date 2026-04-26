import type { ColorScheme, ThemePreference } from "../../middleware/theme-preference";
import { PreferencesForm } from "../../shared/components/preferences-form";
import { DiscordButton } from "./components/discord-button";

export type LoginPageProps = {
  /** Post-login destination (path only, validated). */
  returnTo: string;
  /** Current URL (path + query) for `POST /preferences` redirect so query params (e.g. `returnTo`) are preserved. */
  preferencesFormReturnTo: string;
  theme: ThemePreference;
  colorScheme: ColorScheme;
};

/** Body content for `GET /login`; document shell comes from {@link PageLayout} in the handler. */
export function LoginPage(props: LoginPageProps): JSX.Element {
  return (
    <div class="[ center ]">
      <h1>Sign in</h1>
      <p>
        NDB2 uses Discord to verify your identity. Continue to Discord when you are ready.
      </p>
      <PreferencesForm
        theme={props.theme}
        colorScheme={props.colorScheme}
        returnTo={props.preferencesFormReturnTo}
      />
      <p>
        <DiscordButton returnTo={props.returnTo} />
      </p>
    </div>
  );
}
