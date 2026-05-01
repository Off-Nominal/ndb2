import type { Children } from "@kitajs/html";
import { mergeClass } from "../../utils/merge_class.js";

/**
 * Native `<table>` in `.screen-element`, with optional visual caption **outside** `.table-scroll`
 * so the title stays put while the grid scrolls horizontally on narrow viewports.
 * Use `aria-label` (and/or `caption`) for the accessible name — there is no `<caption>` element.
 */
export type TableProps = Omit<JSX.IntrinsicElements["table"], "class" | "children"> & {
  class?: string;
  children: Children;
  /** Ribbon title rendered above the scroll region (not inside `<table>`). */
  caption?: Children;
  /** Kitajs `table` typings omit these when calling `Table` as a function. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

/** Title ribbon with the same treatment as {@link CardScreenElement}; renders as `<div>`, not `<caption>`. */
export type TableCaptionProps = Omit<JSX.IntrinsicElements["div"], "class" | "children"> & {
  children: Children;
  class?: string;
};

const SHELL_CLASS = "[ screen-element ] [ table-shell ]";

export function Table(props: TableProps): JSX.Element {
  const { class: className, caption, children, ...rest } = props;
  return (
    <div class={mergeClass(SHELL_CLASS, className)}>
      {caption}
      <div class="[ table-scroll ]">
        <table {...rest}>{children}</table>
      </div>
    </div>
  );
}

export function TableCaption(props: TableCaptionProps): JSX.Element {
  const { class: className, children, ...rest } = props;
  return (
    <div
      class={mergeClass("[ table-shell-caption ]", className)}
      {...rest}
    >
      <div class="[ table-caption-bar ] [ primary-specular-gradient ]">
        <span class={mergeClass("[ table-caption-heading ]", "[ canvas-knockout-text ]")}>
          {children}
        </span>
      </div>
    </div>
  );
}
