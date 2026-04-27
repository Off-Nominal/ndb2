import { mergeClass } from "../../utils/merge_class.js";

type NativeSelect = Omit<
  JSX.IntrinsicElements["select"],
  "children" | "class" | "value" | "id" | "aria-label"
> & {
  /** Current selection; each `<option>` gets `selected` when it matches (no `value` on `<select>` in output). */
  value: string;
  options: readonly SelectOption[];
  class?: string;
  id?: string;
  /** Shorthand for the trigger button (custom UI); not applied to the hidden native `<select>`. */
  "aria-label"?: string;
};

/**
 * Custom dropdown: a single **`.select__surface` + `.screen-element`** wraps trigger and list; a hidden native **`<select>`** keeps
 * **`<form>`** / **`change`** events (`name`, bubbling). **`class`** is merged with
 * **`[ constrain-to-parent ] [ select ]`**. Most native pass-throughs target the hidden
 * **`<select>`**; **`id`** and **`aria-label`** target the focusable **trigger** (see **form-field**).
 */
export type SelectOption = { value: string; label: string };

export type SelectProps = NativeSelect;

function selectBaseId(props: { id?: string; name?: string; value: string; options: readonly SelectOption[] }): string {
  if (props.id != null && props.id !== "") {
    return props.id;
  }
  if (props.name != null && String(props.name) !== "") {
    return `select-${String(props.name)}`;
  }
  return `select-${props.value}-${props.options.map((o) => o.value).join("-")}`.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function Select(props: SelectProps): JSX.Element {
  const { options, value, class: className, id, "aria-label": ariaLabel, ...selectRest } = props;
  const baseId = selectBaseId({ id, name: "name" in selectRest ? String(selectRest.name) : undefined, value, options });
  const listboxId = `${baseId}-listbox`;
  const selected = options.find((o) => o.value === value);
  const displayLabel = selected != null ? selected.label : value;

  return (
    <div
      class={mergeClass("[ constrain-to-parent ] [ select ]", className)}
      data-select
    >
      <select
        {...selectRest}
        id={`${baseId}-native`}
        class="select__native"
        tabindex={-1}
        aria-hidden="true"
        data-select-native
      >
        {options.map((opt) => (
          <option
            value={opt.value}
            {...(value === opt.value ? { selected: true } : {})}
          >
            {opt.label}
          </option>
        ))}
      </select>
      <div class="[ screen-element ] [ select__surface ]" data-select-surface>
        <button
          type="button"
          class="[ select__trigger ]"
          id={baseId}
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-controls={listboxId}
          {...(ariaLabel != null && ariaLabel !== "" ? { "aria-label": ariaLabel } : {})}
          data-select-trigger
        >
          <span class="select__value" data-select-value>
            {displayLabel}
          </span>
          <span class="select__chevron" aria-hidden="true">
            ▼
          </span>
        </button>
        <ul
          class="[ select__list ]"
          id={listboxId}
          role="listbox"
          hidden
          data-select-list
        >
          {options.map((opt) => (
            <li
              class="[ select__option ]"
              id={`${baseId}-opt-${opt.value.replace(/[^a-zA-Z0-9_-]/g, "-")}`}
              role="option"
              data-value={opt.value}
              {...(value === opt.value ? { "aria-selected": "true" as const } : { "aria-selected": "false" as const })}
              data-select-option
            >
              {opt.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
