import type { Children } from "@kitajs/html";
import { createElement } from "@kitajs/html";
import type { HeadingElement } from "@web/shared/types/heading-element.js";
import { mergeClass } from "../../utils/merge_class.js";

const BASE = "[ screen-element ] [ card-screen-element ] [ glass-primary-frost ]";

export type CardScreenElementProps = {
  children: Children;
  class?: string;
  heading: string;
  headingElement: HeadingElement;
  /**
   * When `"auto"`, wraps body children in a horizontal strip with `overflow-x: auto` inside the padded
   * region (padding stays outside the scrollport). Use for wide tables, toolbars, or any overflowing row.
   */
  bodyOverflowX?: "auto";
};

/**
 * Glass HUD `screen-element` panel with a primary-colour title bar: text is “knocked out” so the face
 * shows the canvas background (`--color-bg`) through the letters, inverted against the ribbon.
 *
 * Optional **`bodyOverflowX="auto"`** wraps the body in `.horizontal-scroll-region` (see `utilities.css`).
 */
export function CardScreenElement(props: CardScreenElementProps): JSX.Element {
  const title = createElement(
    props.headingElement,
    { class: mergeClass("[ card-screen-element__heading ]", "[ canvas-knockout-text ]") },
    props.heading,
  );

  const bodyContent =
    props.bodyOverflowX === "auto" ? (
      <div class="[ horizontal-scroll-region ]">{props.children}</div>
    ) : (
      props.children
    );

  return (
    <div class={mergeClass(BASE, props.class)}>
      <div class="[ card-screen-element__bar ] [ primary-specular-gradient ]">{title}</div>
      <div class="[ card-screen-element__body ]">{bodyContent}</div>
    </div>
  );
}
