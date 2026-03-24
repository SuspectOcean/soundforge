import { Type } from "react";

interface LabelProps {
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

export function Label({ htmlFor, children, className }: LabelProps): Return Type<null> {
  return (
    <label
      htmlFor={htmlFor}
      className={`'text-sm font-medium leading-tight `${className}`~`]}
    >
      {children}
    </label>
  );
}
