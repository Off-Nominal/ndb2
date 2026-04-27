import type { Children } from "@kitajs/html";
import { mergeClass } from "../../utils/merge_class.js";

type NativeButton = Omit<JSX.IntrinsicElements["button"], "class" | "children"> & {
  children: Children;
  class?: string;
  /** Omit for a real `<button>`; use {@link href} for a link-styled control. */
  href?: never;
};

type LinkButton = Omit<JSX.IntrinsicElements["a"], "class" | "children"> & {
  children: Children;
  class?: string;
  href: string;
};

export type ButtonProps = NativeButton | LinkButton;

/** Compositions → utilities → blocks: `screen-element`, `ring`, then `button` (block). */
const BASE_CLASS = "[ screen-element ] [ ring ] [ button ]";

/** Theme-accent control; `screen-element` is the “glass screen” border/glow; `button` is block layout/type. */
export function Button(props: ButtonProps): JSX.Element {
  if ("href" in props && props.href != null) {
    const { children, class: className, href, ...rest } = props;
    return (
      <a class={mergeClass(BASE_CLASS, className)} href={href} {...rest}>
        {children}
      </a>
    );
  }
  const { children, class: className, type: buttonType = "button", ...rest } = props;
  return (
    <button class={mergeClass(BASE_CLASS, className)} type={buttonType} {...rest}>
      {children}
    </button>
  );
}
