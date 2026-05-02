import type { Children } from "@kitajs/html";
import { mergeClass } from "../../../../utils/merge_class.js";

/** Props forwarded to each ▲ / ▼ control (`type` defaults to `button`). */
export type ThSortButtonProps = Omit<
  JSX.IntrinsicElements["button"],
  "class" | "children"
> & {
  class?: string;
  /** Kitajs `HtmlTag` typings omit WAI-ARIA; allow the sort controls to set these explicitly. */
  "aria-label"?: string;
  "aria-pressed"?: string;
};

export type ThProps = {
  /** Column title shown above the sort controls. */
  label: Children;
  /** `aria-label` on the `role="group"` wrapper around both buttons. */
  sortGroupAriaLabel: string;
  ascending: ThSortButtonProps;
  descending: ThSortButtonProps;
  /** Extra classes on `<th>` (e.g. `.table-cell--align-*`). */
  thClass?: string;
  /** Extra classes on the ▲▼ container (route-specific modifiers). */
  sortControlsClass?: string;
};

const TABLE_COL_SORT = "[ table-col-sort ]";
const TABLE_COL_SORT_LABEL = "[ table-col-sort__label ]";
const TABLE_COL_SORT_CONTROLS = "[ table-col-sort__controls ]";
const TABLE_COL_SORT_BTN = "[ table-col-sort__btn ]";

/**
 * Sortable `<th>`: label plus ▲▼ direction controls. Pass HTMX / ARIA / URLs via
 * {@link ThProps.ascending} and `.descending`; styles live in `th.css`.
 */
export function Th(props: ThProps): JSX.Element {
  const {
    class: ascClassName,
    type: ascType = "button",
    ...ascRest
  } = props.ascending;
  const {
    class: descClassName,
    type: descType = "button",
    ...descRest
  } = props.descending;

  return (
    <th scope="col" class={props.thClass}>
      <span class={TABLE_COL_SORT}>
        <span class={TABLE_COL_SORT_LABEL}>{props.label}</span>
        <span
          class={mergeClass(TABLE_COL_SORT_CONTROLS, props.sortControlsClass)}
          role="group"
          aria-label={props.sortGroupAriaLabel}
        >
          <button
            type={ascType}
            class={mergeClass(TABLE_COL_SORT_BTN, ascClassName)}
            {...ascRest}
          >
            ▲
          </button>
          <button
            type={descType}
            class={mergeClass(TABLE_COL_SORT_BTN, descClassName)}
            {...descRest}
          >
            ▼
          </button>
        </span>
      </span>
    </th>
  );
}
