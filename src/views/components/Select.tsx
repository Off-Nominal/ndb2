import { ReactNode } from "react";
import { BaseSelect, BaseSelectProps } from "./BaseSelect";

export interface SelectProps<T extends ReactNode>
  extends Omit<BaseSelectProps<T>, "input"> {
  placeholder?: string;
}

export const Select = <T extends ReactNode>(props: SelectProps<T>) => {
  const input = (
    <>
      <div>
        <span>
          {props.options.find((o) => o.value === props.value)?.label ||
            props.placeholder ||
            "Select an option"}
        </span>
      </div>
      <div className="clip-triangle h-5 w-5 bg-slate-800 dark:bg-white"></div>
    </>
  );

  return (
    <BaseSelect
      name={props.name}
      options={props.options}
      value={props.value}
      handlers={props.handlers}
      className={props.className}
      id={props.id}
      input={input}
    />
  );
};
