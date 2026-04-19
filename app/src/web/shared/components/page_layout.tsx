export type page_layout_props = {
  children: JSX.Element;
};

/**
 * Full-document shell (markup-driven CUBE — see cube-css-authoring skill).
 * Uses literal bracket tokens in `class` for scanning: `[ region ]` then `[ content-column ]`.
 */
const PAGE_LAYOUT_CLASSES = "[ center ] [ page-layout ]";

/** Wraps body content in the default document column (region + center + measure + gutter). */
export function page_layout(props: page_layout_props): JSX.Element {
  return <div class={PAGE_LAYOUT_CLASSES}>{props.children}</div>;
}
