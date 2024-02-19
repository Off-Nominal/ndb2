import { ReactNode } from "react";

type ListProps = {
  items: ReactNode[];
  headerElement?: ReactNode;
};

export const List = (props: ListProps) => {
  return (
    <ul className="flex flex-col pb-6">
      {props.headerElement && (
        <div className="px-4 py-2 sm:py-4">{props.headerElement}</div>
      )}
      {props.items.map((item, i) => {
        return (
          <li
            className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 sm:py-4"
            key={i}
          >
            {item}
          </li>
        );
      })}
    </ul>
  );
};
