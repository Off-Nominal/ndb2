import type { Children } from "@kitajs/html";
import { mergeClass } from "../../utils/merge_class.js";
import { Button } from "../button";

/**
 * Props forwarded to each **`Button`** (**`<button>`** only — no **`href`**, no **`disabled`**; pagination derives **`disabled`**).
 */
export type PaginationNavButtonPassthrough = Omit<
  JSX.IntrinsicElements["button"],
  "children" | "type" | "class" | "disabled"
> & {
  class?: string;
  "aria-label"?: string;
};

export type PaginationNavProps = {
  /** Current page (**1-based**). */
  page: number;
  /** When false, **Next** is **`disabled`** (e.g. last chunk shorter than **`page_size`**). */
  hasNextPage: boolean;
  class?: string;
  /** Default **`Results pagination`**. */
  navAriaLabel?: string;
  /** Default **`← Previous`**. */
  previousLabel?: Children;
  /** Default **`Next →`**. */
  nextLabel?: Children;
  /** e.g. **`hx-get`**, **`hx-include`** (step 36). */
  previousButtonProps?: PaginationNavButtonPassthrough;
  nextButtonProps?: PaginationNavButtonPassthrough;
};

/**
 * Results pager: **`nav`** landmark, **Previous** / **Next** **`Button`**s, **`Page N`** with **`aria-live="polite"`**.
 * HTMX attributes pass through **`previousButtonProps`** / **`nextButtonProps`**.
 */
export function PaginationNav(props: PaginationNavProps): JSX.Element {
  const navAriaLabel =
    props.navAriaLabel !== undefined && props.navAriaLabel !== ""
      ? props.navAriaLabel
      : "Results pagination";

  const previousLabel = props.previousLabel ?? "← Previous";
  const nextLabel = props.nextLabel ?? "Next →";

  const prevPt = props.previousButtonProps;
  const nextPt = props.nextButtonProps;
  const { class: prevButtonClass, ...prevRest } = prevPt ?? {};
  const { class: nextButtonClass, ...nextRest } = nextPt ?? {};

  const prevAriaLabel =
    prevPt != null &&
    typeof prevPt["aria-label"] === "string" &&
    prevPt["aria-label"].length > 0
      ? prevPt["aria-label"]
      : "Previous page";

  const nextAriaLabel =
    nextPt != null &&
    typeof nextPt["aria-label"] === "string" &&
    nextPt["aria-label"].length > 0
      ? nextPt["aria-label"]
      : "Next page";

  const prevDisabled = props.page <= 1;
  const nextDisabled = !props.hasNextPage;

  return (
    <nav class={mergeClass("[ pagination-nav ]", props.class)} aria-label={navAriaLabel}>
      <Button
        type="button"
        disabled={prevDisabled}
        {...prevRest}
        class={mergeClass("[ pagination-nav__pager ]", prevButtonClass)}
        aria-label={prevAriaLabel}
      >
        {previousLabel}
      </Button>
      <span aria-live="polite">Page {props.page}</span>
      <Button
        type="button"
        disabled={nextDisabled}
        {...nextRest}
        class={mergeClass("[ pagination-nav__pager ]", nextButtonClass)}
        aria-label={nextAriaLabel}
      >
        {nextLabel}
      </Button>
    </nav>
  );
}
