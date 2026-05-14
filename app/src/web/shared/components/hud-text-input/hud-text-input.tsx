import { mergeClass } from "../../utils/merge_class.js";

export type HudTextInputProps = Omit<JSX.IntrinsicElements["input"], "class"> & {
  class?: string;
};

/**
 * HUD single-line field (terminal-style leading glyph). Compose under **`FormField`** with matching **`id`** / **`for`**.
 *
 * Uses **`screen-element-secondary`** — intended for controls **nested** inside primary **`screen-element`** shells.
 */
export function HudTextInput(props: HudTextInputProps): JSX.Element {
  const { class: className, type = "text", ...rest } = props;
  return (
    <div
      class={mergeClass(
        "[ hud-text-input ] [ screen-element-secondary ]",
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
