import clsx from "clsx";

export default function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className={clsx(
        "inline-flex items-center rounded-full border border-neutral-300 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-700",
        className
      )}
    />
  );
}


