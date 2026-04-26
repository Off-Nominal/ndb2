import { mergeClass } from "../../utils/merge_class.js";

type NativeSelect = Omit<JSX.IntrinsicElements["select"], "children" | "class" | "value"> & {
  /** Current selection; each `<option>` gets `selected` when it matches (no `value` on `<select>` in output). */
  value: string;
  options: readonly SelectOption[];
  class?: string;
};

/**
 * Renders a native **`<select>`** with a fixed list of **value/label** options and **one** selected value.
 * **`class`** is merged with **`[ constrain-to-parent ]`** (utility, see **styles/utilities.css**) and
 * **`[ select ]`** (block, see **select.css**). Other native attributes (e.g. **`disabled`**, **htmx**)
 * pass through from **`SelectProps`**, which is based on the intrinsic **`<select>`** attribute set.
 */
export type SelectOption = { value: string; label: string };

export type SelectProps = NativeSelect;

export function Select(props: SelectProps): JSX.Element {
  const { options, value, class: className, ...rest } = props;
  return (
    <select
      {...rest}
      class={mergeClass("[ constrain-to-parent ] [ select ]", className)}
    >
      {options.map((opt) => (
        <option
          value={opt.value}
          {...(value === opt.value ? { selected: true } : {})}
        >
          {opt.label}
        </option>
      ))}
    </select>
  );
}
