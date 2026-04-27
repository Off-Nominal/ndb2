import type { Children } from "@kitajs/html";
import { mergeClass } from "../../utils/merge_class.js";

const BASE = "[ screen-element ] [ heading-screen-element ] [ glass-primary-frost ]";

export type HeadingScreenElementProps = {
  /** A single heading (`<h1>`–`<h6>`) or other minimal heading markup. */
  children: Children;
  class?: string;
};

/**
 * Wraps a heading in `screen-element` chrome with the same primary trapezoid ribbon and knockout text
 * as the card heading bar (`primary-specular-gradient`). The bar is the only region inside the frame,
 * so it grows with the heading and can stretch vertically when a parent flex layout allocates height.
 */
export function HeadingScreenElement(props: HeadingScreenElementProps): JSX.Element {
  return (
    <div class={mergeClass(BASE, props.class)}>
      <div class="[ heading-screen-element__bar ] [ primary-specular-gradient ]">{props.children}</div>
    </div>
  );
}
