import { mergeClass } from "../../utils/merge_class.js";

export type HudTextInputProps = Omit<JSX.IntrinsicElements["input"], "class"> & {
  class?: string;
  /** Pairs with hint / error copy (`FormField` validation). */
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
};

/**
 * HUD single-line field (terminal-style leading glyph). Compose under **`FormField`** with matching **`id`** / **`for`**.
 *
 * Uses **`screen-element-secondary`** and **`ring-has-focus-visible`** — intended for controls **nested** inside primary **`screen-element`** shells.
 */
export function HudTextInput(props: HudTextInputProps): JSX.Element {
  const { class: className, type = "text", ...rest } = props;
  return (
    <div
      class={mergeClass(
        "[ hud-text-input ] [ screen-element-secondary ] [ ring-has-focus-visible ]",
        className,
      )}
    >
      <span aria-hidden="true" data-hud-text-input-prompt>
        {">"}
      </span>
      <input type={type} {...rest} />
    </div>
  );
}
