import type { Children } from "@kitajs/html";
import { mergeClass } from "../../utils/merge_class.js";

const BASE = "[ screen-element ] [ heading-screen-element ]";

export type HeadingScreenElementProps = {
  /** A single heading (`<h1>`–`<h6>`) or other minimal heading markup. */
  children: Children;
  class?: string;
};

/** Wraps a heading in the shared glass HUD `screen-element` frame. */
export function HeadingScreenElement(props: HeadingScreenElementProps): JSX.Element {
  return <div class={mergeClass(BASE, props.class)}>{props.children}</div>;
}
