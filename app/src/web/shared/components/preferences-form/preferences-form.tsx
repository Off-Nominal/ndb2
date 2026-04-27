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
  /** Appended to theme/colour control `id`s when two instances exist (e.g. compact + desktop nav). */
  controlIdSuffix?: string;
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
 * **`hx-sync="this:replace"`** cancels an in-flight POST when another `change` fires so rapid picks don’t
 * complete out of order (each post still includes both fields from the form).
 */
export function PreferencesForm(props: PreferencesFormProps): JSX.Element {
  const hasCsrfToken = props.csrfToken != null && props.csrfToken !== "";
  const idSfx = props.controlIdSuffix ?? "";
  const themeFieldId = `${THEME_SELECT_ID}${idSfx}`;
  const colourFieldId = `${COLOUR_SELECT_ID}${idSfx}`;

  return (
    <form
      method="post"
      action="/preferences"
      class={mergeClass("[ stack ]", props.class)}
      hx-post="/preferences"
      hx-trigger="change from:select"
      hx-swap="none"
      hx-sync="this:replace"
    >
      {hasCsrfToken && (
        <input type="hidden" name="_csrf" value={props.csrfToken} />
      )}
      <input type="hidden" name="returnTo" value={props.returnTo} />

      <FormField label="Appearance" fieldId={themeFieldId}>
        <Select
          id={themeFieldId}
          name="theme"
          aria-label="Light, dark, or system appearance"
          value={props.theme}
          options={THEME_SELECT_OPTIONS}
        />
      </FormField>

      <FormField label="Colour" fieldId={colourFieldId}>
        <Select
          id={colourFieldId}
          name="colorScheme"
          aria-label="Accent palette"
          value={props.colorScheme}
          options={COLOR_SCHEME_SELECT_OPTIONS}
        />
      </FormField>
    </form>
  );
}
