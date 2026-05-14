import { mergeClass } from "../../utils/merge_class.js";

export type HudCheckboxProps = Omit<JSX.IntrinsicElements["input"], "type" | "class"> & {
  /** Classes on the outer row (**`<label>`** when **`labelText`** is set, else the tile **`div`**). */
  class?: string;
  /** Pairs with hint / error copy (`FormField` validation). */
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  /**
   * Classes on the native control — use **`visually-hidden`** when a paired **`label`** is the visible tile
   * (status lattice, etc.). Do not combine with **`labelText`** (use **`FormField`** / lattice **`label`** instead).
   */
  inputClass?: string;
  /** Optional copy beside the tile; wraps in **`label`** so the text toggles the box. */
  labelText?: string;
};

/**
 * Square **`screen-element-secondary`** surface **is** the checkbox: native input fills the tile invisibly;
 * checked state shows a center checkmark. Uses **`ring-has-focus-visible`** + **`appearance-none`** on the **`input`**.
 * Pair with **`FormField`** (no **`labelText`**) or pass **`labelText`** for an inline row.
 * Tile size: CSS **`--hud-checkbox-size`** on this element or an ancestor (fallback **2.25rem**); checkmark scales with it.
 *
 * Use **`inputClass="[ visually-hidden ]"`** when a **`label`** owns the visible face (status lattice);
 * the wrapper then uses **`display: contents`** so chrome stays off this node.
 */
export function HudCheckbox(props: HudCheckboxProps): JSX.Element {
  const { class: className, inputClass, labelText, ...inputRest } = props;
  const resolvedInputClass =
    inputClass !== undefined && inputClass.length > 0 ? inputClass : undefined;

  const trimmedLabel =
    labelText !== undefined && labelText.trim().length > 0 ? labelText.trim() : undefined;

  const tile = (
    <div
      class={mergeClass(
        "[ hud-checkbox ] [ screen-element-secondary ] [ ring-has-focus-visible ]",
        trimmedLabel === undefined ? className : undefined,
      )}
    >
      <input
        {...inputRest}
        type="checkbox"
        class={mergeClass("[ appearance-none ]", resolvedInputClass)}
      />
    </div>
  );

  if (trimmedLabel === undefined) {
    return tile;
  }

  return (
    <label class={mergeClass("[ hud-checkbox-field ]", className)}>
      {tile}
      <span class="[ hud-checkbox-inline-label ]">{trimmedLabel}</span>
    </label>
  );
}
