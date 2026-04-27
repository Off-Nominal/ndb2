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
 * Theme and accent palette controls. The companion `preferences-form.client` script
 * sets cookies + `data-theme` / `data-color-scheme` on `document.documentElement` when the
 * user changes a `select` (no full-page POST).
 */
export function PreferencesForm(props: PreferencesFormProps): JSX.Element {
  const idSfx = props.controlIdSuffix ?? "";
  const themeFieldId = `${THEME_SELECT_ID}${idSfx}`;
  const colourFieldId = `${COLOUR_SELECT_ID}${idSfx}`;

  return (
    <div
      class={mergeClass("[ stack ]", props.class)}
      data-preferences-form
    >
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
    </div>
  );
}
