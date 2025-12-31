import clsx from "clsx";

type BaseProps = {
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

type ButtonProps = BaseProps & React.HTMLAttributes<HTMLButtonElement>;
type LinkProps = BaseProps &
  React.HTMLAttributes<HTMLAnchorElement> & {
    href?: string;
    target?: string;
  };

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition",
        variant === "primary" &&
          "bg-brand-600 text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300",
        variant === "secondary" &&
          "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100",
        variant === "ghost" && "text-neutral-700 hover:bg-neutral-100",
        className
      )}
    />
  );
}

export function LinkButton({ variant = "primary", className, ...props }: LinkProps) {
  return (
    <a
      {...props}
      className={clsx(
        "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition",
        variant === "primary" &&
          "bg-brand-600 text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-300",
        variant === "secondary" &&
          "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100",
        variant === "ghost" && "text-neutral-700 hover:bg-neutral-100",
        className
      )}
    />
  );
}


