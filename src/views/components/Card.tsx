import { ReactNode } from "react";

type CardProps = {
  header: ReactNode;
  children: ReactNode | ReactNode[];
  className?: string;
};

export const Card = (props: CardProps) => {
  return (
    <article
      className={
        "rounded-2xl bg-gradient-to-r from-slate-200 to-slate-300 shadow-md dark:from-slate-700 dark:to-slate-600 " +
        props.className
      }
    >
      <header className={"rounded-t-2xl bg-moonstone-blue px-8 py-2"}>
        {props.header}
      </header>
      <section>{props.children}</section>
    </article>
  );
};
