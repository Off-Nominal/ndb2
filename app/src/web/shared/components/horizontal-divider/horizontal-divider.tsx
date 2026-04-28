import { mergeClass } from "../../utils/merge_class.js";

export type HorizontalDividerProps = {
  class?: string;
};

/**
 * Full-width horizontal rule with the same primary border + HUD glow stack as `.screen-element`.
 */
export function HorizontalDivider(props: HorizontalDividerProps): JSX.Element {
  return (
    <hr
      class={mergeClass("[ horizontal-divider ]", props.class)}
      aria-hidden="true"
    />
  );
}
