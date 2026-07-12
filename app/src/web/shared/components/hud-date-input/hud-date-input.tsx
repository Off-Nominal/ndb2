import { mergeClass } from "../../utils/merge_class.js";

export type HudDateInputMode = "date" | "datetime";

export type HudDateInputProps = Omit<
  JSX.IntrinsicElements["input"],
  "class" | "type"
> & {
  /** `"date"` → date-only; `"datetime"` → date + minute precision. */
  mode: HudDateInputMode;
  class?: string;
  /** Accessible name for the open-calendar trigger. */
  "aria-label"?: string;
  /** Pairs with hint / error copy (`FormField` validation). */
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
};

function displayLabel(mode: HudDateInputMode, value: string | undefined): string {
  if (value == null || value === "") {
    return mode === "datetime" ? "Select date & time" : "Select date";
  }
  return value.replace("T", " ");
}

function baseId(props: {
  id?: string | number;
  name?: string | number | boolean;
}): string {
  if (props.id != null && String(props.id) !== "") {
    return String(props.id);
  }
  if (props.name != null && String(props.name) !== "") {
    return `hud-date-${String(props.name)}`;
  }
  return "hud-date";
}

/**
 * HUD date / datetime field with a custom calendar popover. A hidden native
 * `<input>` keeps form posts (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm`). Compose under
 * **`FormField`** with matching **`id`** / **`for`**.
 */
export function HudDateInput(props: HudDateInputProps): JSX.Element {
  const {
    class: className,
    mode,
    id,
    value,
    "aria-label": ariaLabel,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    disabled,
    required,
    name,
    min,
    max,
    ...rest
  } = props;

  const triggerId = baseId({ id, name });
  const panelId = `${triggerId}-panel`;
  const nativeType = mode === "datetime" ? "datetime-local" : "date";
  const valueStr = value == null ? undefined : String(value);

  return (
    <div
      class={mergeClass("[ constrain-to-parent ] [ hud-date-input ]", className)}
      data-hud-date-input
      data-hud-date-mode={mode}
    >
      <input
        {...rest}
        type={nativeType}
        class="[ visually-hidden ]"
        tabindex={-1}
        aria-hidden="true"
        data-hud-date-native
        id={`${triggerId}-native`}
        name={name}
        value={valueStr}
        min={min}
        max={max}
        required={required}
        disabled={disabled}
      />
      <div
        class="[ hud-date-input__surface ] [ screen-element-secondary ] [ ring-has-focus-visible ]"
        data-hud-date-surface
      >
        <span aria-hidden="true" data-hud-date-input-prompt>
          {">"}
        </span>
        <button
          type="button"
          class="[ appearance-none ] [ hud-date-input__trigger ]"
          id={triggerId}
          data-hud-date-trigger
          aria-haspopup="dialog"
          aria-expanded="false"
          aria-controls={panelId}
          disabled={disabled}
          {...(ariaLabel != null && ariaLabel !== ""
            ? { "aria-label": ariaLabel }
            : {})}
          {...(ariaDescribedBy != null
            ? { "aria-describedby": ariaDescribedBy }
            : {})}
          {...(ariaInvalid != null ? { "aria-invalid": ariaInvalid } : {})}
        >
          <span class="[ truncate ]" data-hud-date-display>
            {displayLabel(mode, valueStr)}
          </span>
          <span class="[ hud-date-input__icon ]" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="1em" height="1em" fill="none">
              <rect
                x="1.5"
                y="2.5"
                width="13"
                height="12"
                rx="1.5"
                stroke="currentColor"
                stroke-width="1.25"
              />
              <path
                d="M1.5 6h13M5 1v3M11 1v3"
                stroke="currentColor"
                stroke-width="1.25"
                stroke-linecap="round"
              />
              <rect x="4" y="8.5" width="2" height="2" fill="currentColor" />
              <rect x="7" y="8.5" width="2" height="2" fill="currentColor" />
              <rect x="10" y="8.5" width="2" height="2" fill="currentColor" />
            </svg>
          </span>
        </button>
      </div>
      <div
        id={panelId}
        class="[ hud-date-input__panel ] [ screen-element ]"
        data-hud-date-panel
        role="dialog"
        aria-label={mode === "datetime" ? "Choose date and time" : "Choose date"}
        hidden
      />
    </div>
  );
}
