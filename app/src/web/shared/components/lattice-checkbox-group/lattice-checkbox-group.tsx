import { mergeClass } from "../../utils/merge_class.js";

export type LatticeCheckboxGlyphProps = {
  /** **`SVG`** **`width`** (any CSS length). Default **`1.6em`**. */
  width?: string;
  /** **`SVG`** **`height`** (any CSS length). Default **`1.25em`**. */
  height?: string;
  class?: string;
};

/**
 * Bracket + square **`SVG`** (**`currentColor`**); inner square **`opacity`** toggles with **`label:has(input:checked)`** in **`lattice-checkbox-group.css`**.
 */
export function LatticeCheckboxGlyph(props: LatticeCheckboxGlyphProps): JSX.Element {
  return (
    <svg
      class={mergeClass("[ lattice-checkbox-group-glyph ]", props.class)}
      viewBox="0 0 28 22"
      width={props.width ?? "1.6em"}
      height={props.height ?? "1.25em"}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M 2 1.5 L 2 20.5 M 2 1.5 L 6.75 1.5 M 2 20.5 L 6.75 20.5"
        fill="none"
        stroke="currentColor"
        stroke-width="1.35"
        stroke-linecap="square"
      />
      <path
        d="M 26 1.5 L 26 20.5 M 26 1.5 L 21.25 1.5 M 26 20.5 L 21.25 20.5"
        fill="none"
        stroke="currentColor"
        stroke-width="1.35"
        stroke-linecap="square"
      />
      <rect
        class="lattice-checkbox-group-check-fill"
        x="10"
        y="7"
        width="8"
        height="8"
        fill="currentColor"
      />
    </svg>
  );
}

export type LatticeCheckboxGroupOption = {
  /** Submitted as **`value`** when checked. */
  value: string;
  /** Visible row label (may differ from **`value`**). */
  label: string;
};

export type LatticeCheckboxGroupProps = {
  /** **`GET`** / form **`name`** shared by every **`checkbox`** (distinct **`value`** per row). */
  name: string;
  options: readonly LatticeCheckboxGroupOption[];
  /** Checked **`value`**s for SSR **`checked`** hints. */
  selected?: readonly string[];
  /** **`fieldset`** legend; default **`Options`**. */
  legend?: string;
  class?: string;
  /** Merged onto **`screen-element-secondary`** console wrapper. */
  consoleClass?: string;
  /** Merged onto each visible option row (**`.lattice-checkbox-group-option`**). */
  optionRowClass?: string;
  disabled?: boolean;
  /** Stable **`id`** stem; rows use **`${prefix}-opt-${index}`**. */
  controlIdPrefix?: string;
  checkGlyphWidth?: string;
  checkGlyphHeight?: string;
  checkGlyphClass?: string;
};

const DEFAULT_LEGEND = "Options";

/**
 * Vertical HUD **`fieldset`**: **`screen-element-secondary`** console, **`visually-hidden`** checkboxes,
 * bracket **`SVG`** rows (**`LatticeCheckboxGlyph`**).
 */
export function LatticeCheckboxGroup(props: LatticeCheckboxGroupProps): JSX.Element {
  const legendText =
    props.legend !== undefined && props.legend.trim().length > 0
      ? props.legend.trim()
      : DEFAULT_LEGEND;

  const idPrefix =
    props.controlIdPrefix !== undefined && props.controlIdPrefix.trim().length > 0
      ? props.controlIdPrefix.trim()
      : "lattice-checkbox-group";

  const selected =
    props.selected !== undefined ? new Set(props.selected) : new Set<string>();

  const disabled = props.disabled === true;

  return (
    <fieldset
      class={mergeClass("[ lattice-checkbox-group ]", props.class)}
      {...(disabled ? { disabled: true } : {})}
    >
      <legend>{legendText}</legend>
      <div
        class={mergeClass(
          "[ lattice-checkbox-group-console ] [ screen-element-secondary ] [ ring-has-focus-visible ]",
          props.consoleClass,
        )}
      >
        <ul>
          {props.options.map((option, index) => {
            const controlId = `${idPrefix}-opt-${index}`;
            return (
              <li>
                <label>
                  <input
                    id={controlId}
                    type="checkbox"
                    name={props.name}
                    value={option.value}
                    class="[ visually-hidden ]"
                    checked={selected.has(option.value)}
                  />
                  <span
                    class={mergeClass("[ lattice-checkbox-group-option ]", props.optionRowClass)}
                  >
                    <span class="lattice-checkbox-group-prefix" aria-hidden="true">
                      <LatticeCheckboxGlyph
                        width={props.checkGlyphWidth}
                        height={props.checkGlyphHeight}
                        class={props.checkGlyphClass}
                      />
                    </span>
                    <span class="lattice-checkbox-group-label">{option.label}</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </fieldset>
  );
}
