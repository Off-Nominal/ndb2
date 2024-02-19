import { ReactNode } from "react";

export type SelectOption<T extends ReactNode> = {
  label: T;
  value: string;
  ariaLabel: string;
};

export type BaseSelectProps<T extends ReactNode> = {
  name: string;
  id?: string;
  options: SelectOption<T>[];
  optionLimit?: number;
  value?: string;
  className?: string;
  input: ReactNode;
  handlers: {
    get?: (value: string) => string;
    post?: (value: string) => string;
    put?: (value: string) => string;
    delete?: (value: string) => string;
    patch?: (value: string) => string;
    target?: string;
    push?: boolean;
    swap?: "outerHTML" | "innerHTML";
  };
};

export const BaseSelect = <T extends ReactNode>(props: BaseSelectProps<T>) => {
  const optionLimit = props.optionLimit || props.options.length;

  return (
    <div
      className={["relative", props.className].join(" ")}
      id={props.id}
      role="listbox"
      aria-label={props.name}
      x-data="{ open: false }"
      // tslint:disable-next-line
      x-bind="{'@click'() { open = ! open } }"
      // x-bind="{'@click.outside'() { open = false } }"
    >
      <div
        className={
          "rounded-t-lg rounded-b-lg flex w-full justify-between border-2 border-slate-300 bg-gradient-to-b from-slate-200 to-slate-300 px-4 py-2 dark:border-slate-600 dark:bg-slate-700 dark:from-slate-700 dark:to-slate-600"
        }
      >
        {props.input}
      </div>
      <div
        className={
          "hidden absolute z-10 w-full rounded-b-lg border-2 border-slate-300 bg-gradient-to-r from-slate-200 to-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:from-slate-700 dark:to-slate-600"
        }
        role="list"
        x-show="open"
      >
        {props.options.slice(0, optionLimit).map((option) => {
          return (
            <div
              hx-get={props.handlers.get?.(option.value)}
              hx-post={props.handlers.post?.(option.value)}
              hx-put={props.handlers.put?.(option.value)}
              hx-delete={props.handlers.delete?.(option.value)}
              hx-patch={props.handlers.patch?.(option.value)}
              hx-target={props.handlers.target}
              hx-push-url={props.handlers.push ? "true" : "false"}
              hx-swap={props.handlers.swap ? "outerHTML" : "innerHTML"}
              role="option"
              className="px-4 py-4 hover:bg-slate-100 dark:hover:bg-slate-600 md:py-2"
              aria-selected={props.value === option.value}
              aria-label={option.ariaLabel}
              key={option.value}
            >
              {option.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};
