import type { Children } from "@kitajs/html";
import { mergeClass } from "../../utils/merge_class.js";

/** Native `<table>` with shared layout/tint rules (class `table`). Often inside {@link CardScreenElement}. */
export type TableProps = Omit<JSX.IntrinsicElements["table"], "class" | "children"> & {
  class?: string;
  children: Children;
};

export function Table(props: TableProps): JSX.Element {
  const { class: className, children, ...rest } = props;
  return (
    <table class={mergeClass("[ table ]", className)} {...rest}>
      {children}
    </table>
  );
}
