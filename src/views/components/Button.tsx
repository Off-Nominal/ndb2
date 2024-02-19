import { MouseEventHandler, ReactNode } from "react";

type ButtonProps = {
  children: ReactNode | ReactNode[];
  size?: "xs" | "sm" | "md" | "lg";
  color?: "primary" | "secondary";
  type?: "button" | "submit" | "reset" | undefined;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
};

export const Button = (props: ButtonProps) => {
  let sizeClasses = "px-6 py-3 text-lg";
  let colorClasses = " bg-moss-green hover:bg-moss-green-dark";

  if (props.size === "xs") {
    sizeClasses = "px-4 py-0 text-sm";
  } else if (props.size === "sm") {
    sizeClasses = "px-6 py-2 text-md";
  } else if (props.size === "md") {
    sizeClasses = "px-6 py-3 text-lg";
  } else if (props.size === "lg") {
    sizeClasses = "px-8 py-4 text-2xl";
  }

  if (props.color === "secondary") {
    colorClasses =
      " border-moonstone-blue border-2 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500";
  }

  const type: "button" | "submit" | "reset" | undefined =
    props.type || "button";

  const className = [
    sizeClasses,
    colorClasses,
    "rounded-full text-center font-bold uppercase tracking-widest shadow-md",
  ];

  if (props.className) {
    className.push(props.className);
  }

  return (
    <button type={type} className={className.join(" ")} onClick={props.onClick}>
      {props.children}
    </button>
  );
};
