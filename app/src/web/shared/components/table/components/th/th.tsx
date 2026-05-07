import type { Children } from "@kitajs/html";
import { mergeClass } from "../../../../utils/merge_class.js";

/** Sort-direction glyph + shared button styling; compose two inside {@link Th}. */
export type ThSortButtonProps = Omit<
  JSX.IntrinsicElements["button"],
  "class" | "children"
> & {
  class?: string;
  /** Kitajs `HtmlTag` typings omit WAI-ARIA for buttons; set explicitly here. */
  "aria-label"?: string;
  "aria-pressed"?: string;
  direction: "asc" | "desc";
};

export function ThSortButton(props: ThSortButtonProps): JSX.Element {
  const { class: className, type = "button", direction, ...rest } = props;
  const glyph = direction === "asc" ? "▲" : "▼";

  return (
    <button type={type} class={mergeClass("[ table-th-sort-button ]", className)} {...rest}>
      {glyph}
    </button>
  );
}

export type ThProps = {
  /** Column title shown above the sort controls. */
  label: Children;
  /** `aria-label` on the `role="group"` wrapper around the sort buttons. */
  sortGroupAriaLabel: string;
  /** Typically two {@link ThSortButton} elements (▲ / ▼). */
  children: Children;
  /** Extra classes on `<th>` (e.g. `.table-cell--align-*`, `.table-cell--column-divider`). */
  class?: string;
};

/**
 * Sortable `<th>`: label plus a group for {@link ThSortButton} controls. Styles live in `th.css`.
 */
export function Th(props: ThProps): JSX.Element {
  return (
    <th scope="col" class={mergeClass("[ table-th ]", props.class)}>
      <div>
        <span>{props.label}</span>
        <div
          class="[ table-th__controls ]"
          role="group"
          aria-label={props.sortGroupAriaLabel}
        >
          {props.children}
        </div>
      </div>
    </th>
  );
}
