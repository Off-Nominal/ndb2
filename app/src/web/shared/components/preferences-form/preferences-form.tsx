import {
  SCHEME_HUE_DEFS,
  type ColorScheme,
  type ThemePreference,
} from "../../../middleware/theme-preference";
import { FormField } from "../form-field";
import { Select, type SelectOption } from "../select";
import { mergeClass } from "../../utils/merge_class.js";

export type PreferencesFormProps = {
  theme: ThemePreference;
  colorScheme: ColorScheme;
  /** Path for `POST` redirect target (same-origin, `safeReturnTo`). */
  returnTo: string;
  /** When set, `POST /preferences` requires this CSRF token (signed-in nav). */
  csrfToken?: string;
  class?: string;
};

const THEME_SELECT_ID = "preferences-form__theme";
const COLOUR_SELECT_ID = "preferences-form__colour";

const THEME_SELECT_OPTIONS: readonly SelectOption[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const COLOR_SCHEME_SELECT_OPTIONS: readonly SelectOption[] = SCHEME_HUE_DEFS.map((h) => ({
  value: h.id,
  label: h.label,
}));

/**
 * Server-side appearance: `POST /preferences` sets cookies. HTMX submits on `select` change (no save button);
 * non-HTMX clients still post via the same `action` if you add a control or boost elsewhere.
 */
export function PreferencesForm(props: PreferencesFormProps): JSX.Element {
  const hasCsrfToken = props.csrfToken != null && props.csrfToken !== "";

  return (
    <form
      method="post"
      action="/preferences"
      class={mergeClass("[ stack ]", props.class)}
      hx-post="/preferences"
      hx-trigger="change from:select"
      hx-swap="none"
    >
      {hasCsrfToken && (
        <input type="hidden" name="_csrf" value={props.csrfToken} />
      )}
      <input type="hidden" name="returnTo" value={props.returnTo} />

      <FormField label="Appearance" fieldId={THEME_SELECT_ID}>
        <Select
          id={THEME_SELECT_ID}
          name="theme"
          aria-label="Light, dark, or system appearance"
          value={props.theme}
          options={THEME_SELECT_OPTIONS}
        />
      </FormField>

      <FormField label="Colour" fieldId={COLOUR_SELECT_ID}>
        <Select
          id={COLOUR_SELECT_ID}
          name="colorScheme"
          aria-label="Accent palette"
          value={props.colorScheme}
          options={COLOR_SCHEME_SELECT_OPTIONS}
        />
      </FormField>
    </form>
  );
}
