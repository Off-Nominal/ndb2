export type PageLayoutProps = {
  children: JSX.Element;
};

/**
 * Full-document shell (markup-driven CUBE — see cube-css-authoring skill).
 * Uses literal bracket tokens in `class` for scanning: `[ center ]` then `[ page-layout ]`.
 */
const PAGE_LAYOUT_CLASSES = "[ center ] [ page-layout ]";

/** Wraps body content in the default document column. */
export function PageLayout(props: PageLayoutProps): JSX.Element {
  return <div class={PAGE_LAYOUT_CLASSES}>{props.children}</div>;
}
