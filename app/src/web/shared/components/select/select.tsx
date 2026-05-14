import { mergeClass } from "../../utils/merge_class.js";

/**
 * Custom dropdown: a single **`.select__surface` + `.screen-element`** wraps trigger and list; a hidden native **`<select>`** keeps
 * **`<form>`** / **`change`** events (`name`, bubbling). **`class`** is merged with
 * **`[ constrain-to-parent ] [ select ]`**. Most native pass-throughs target the hidden
 * **`<select>`**; **`id`** and **`aria-label`** target the focusable **trigger** (see **form-field**).
 */
export type SelectOption = {
  value: string;
  /** Plain label for `<option>`, screen readers, native fallback (`optionDisplayLabelForNativeSelect`), and Fuse **`searchable`** keys. */
  label: string;
  /** Trusted HTML for the custom trigger + list row (e.g. inline markdown via `marked.parseInline`). */
  labelHtml?: string;
};

type NativeSelect = Omit<
  JSX.IntrinsicElements["select"],
  "children" | "class" | "value" | "id" | "aria-label"
> & {
  /** Current selection; each `<option>` gets `selected` when it matches (no `value` on `<select>` in output). */
  value: string;
  options: readonly SelectOption[];
  class?: string;
  id?: string;
  /** Shorthand for the focusable combobox control (custom UI); not applied to the hidden native **`<select>`**. */
  "aria-label"?: string;
  /** Closed trigger + list rows: plain **`label`** vs stacked **`labelHtml`** (ignored on searchable trigger — closed field shows plain **`label`** only). */
  valueLayout?: "truncate" | "multiline";
  /** Fuzzy filter via Fuse.js (`select.client.ts`); trigger becomes a **`readonly`** input until the panel opens. */
  searchable?: boolean;
  /** Shown as the input **`placeholder`** while the panel is open (`searchable` only). */
  searchPlaceholder?: string;
};

export type SelectProps = NativeSelect;

function encodeRichLabelPayload(html: string): string {
  return encodeURIComponent(html);
}

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
  const {
    options,
    value,
    class: className,
    id,
    "aria-label": ariaLabel,
    valueLayout = "truncate",
    searchable = false,
    searchPlaceholder,
    ...selectRest
  } = props;
  const baseId = selectBaseId({ id, name: "name" in selectRest ? String(selectRest.name) : undefined, value, options });
  const listboxId = `${baseId}-listbox`;
  const selected = options.find((o) => o.value === value);
  const displayPlain = selected != null ? selected.label : value;
  const triggerBody =
    selected?.labelHtml !== undefined && selected.labelHtml !== ""
      ? selected.labelHtml
      : displayPlain;

  const searchableAttrs = searchable
    ? ({
        "data-select-searchable": "true" as const,
      } as const)
    : ({} as const);

  const placeholder =
    searchPlaceholder != null && searchPlaceholder !== "" ? searchPlaceholder : "Search…";

  return (
    <div
      class={mergeClass("[ constrain-to-parent ] [ select ]", className)}
      data-select
      {...searchableAttrs}
      {...(!searchable && valueLayout === "multiline"
        ? { "data-select-value-layout": "multiline" }
        : {})}
    >
      <select
        {...selectRest}
        id={`${baseId}-native`}
        class="[ visually-hidden ]"
        tabindex={-1}
        aria-hidden="true"
        data-select-native
      >
        {options.map((opt) => {
          const encoded =
            opt.labelHtml !== undefined && opt.labelHtml !== ""
              ? encodeRichLabelPayload(opt.labelHtml)
              : undefined;
          return (
            <option
              value={opt.value}
              {...(encoded !== undefined ? { "data-rich-label": encoded } : {})}
              {...(value === opt.value ? { selected: true } : {})}
            >
              {opt.label}
            </option>
          );
        })}
      </select>
      <div class="[ screen-element ] [ select__surface ]" data-select-surface>
        {searchable ? (
          <div class="[ select__trigger-field ] [ ring-has-focus-visible ]" data-select-trigger-field>
            <input
              type="text"
              class={mergeClass("[ appearance-none ] [ select__trigger ] [ select__trigger--searchable ]", undefined)}
              id={baseId}
              role="combobox"
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-expanded="false"
              aria-controls={listboxId}
              autocomplete="off"
              spellcheck={false}
              readonly
              placeholder={placeholder}
              data-select-trigger
              data-select-value
              {...(ariaLabel != null && ariaLabel !== "" ? { "aria-label": ariaLabel } : {})}
            />
            <span class="select__chevron" aria-hidden="true">
              ▼
            </span>
          </div>
        ) : (
          <button
            type="button"
            class="[ ring ] [ appearance-none ] [ select__trigger ]"
            id={baseId}
            aria-haspopup="listbox"
            aria-expanded="false"
            aria-controls={listboxId}
            {...(ariaLabel != null && ariaLabel !== "" ? { "aria-label": ariaLabel } : {})}
            data-select-trigger
          >
            <span
              class={mergeClass(
                "[ select__value ]",
                valueLayout === "truncate" ? "[ truncate ]" : "[ select__value--multiline ]",
              )}
              data-select-value
            >
              {triggerBody}
            </span>
            <span class="select__chevron" aria-hidden="true">
              ▼
            </span>
          </button>
        )}
        <ul
          class="[ hide-scrollbar ] [ select__list ]"
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
              data-select-search-label={opt.label}
              {...(value === opt.value ? { "aria-selected": "true" as const } : { "aria-selected": "false" as const })}
              data-select-option
            >
              {opt.labelHtml !== undefined && opt.labelHtml !== "" ? opt.labelHtml : opt.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
