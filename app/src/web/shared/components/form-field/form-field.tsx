import { mergeClass } from "../../utils/merge_class.js";

export type FormFieldProps = {
  /** Shown in `<label>`. */
  label: string;
  /** Matches the control’s `id` for `for` / a11y. */
  fieldId: string;
  children: JSX.Element;
  class?: string;
};

/**
 * Stacks a **label** above a **single child** (typically a `<select>`) using the **`[ stack ]`** composition.
 * See **form-field.css** for label styles; **`<select>`** chrome lives with **`Select`** (**`select.css`**).
 */
export function FormField(props: FormFieldProps): JSX.Element {
  return (
    <div class={mergeClass("[ form-field ] [ stack ]", props.class)}>
      <label for={props.fieldId}>{props.label}</label>
      {props.children}
    </div>
  );
}
