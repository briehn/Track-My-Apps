import Link from "next/link";
import type { ComponentProps } from "react";

type LinkButtonVariant = "primary" | "secondary" | "ghost";

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: LinkButtonVariant;
};

const variantClasses: Record<LinkButtonVariant, string> = {
  primary:
    "border border-slate-950 bg-slate-950 text-white shadow-sm hover:border-slate-800 hover:bg-slate-800 hover:shadow-md dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950 dark:hover:border-white dark:hover:bg-white dark:hover:shadow-md",
  secondary:
    "border border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-100 hover:shadow-md dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:shadow-md",
  ghost:
    "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
};

export function LinkButton({
  className,
  variant = "primary",
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={[
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-[background-color,border-color,box-shadow,color] duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 focus-visible:ring-offset-2 dark:focus-visible:ring-sky-400/70 dark:focus-visible:ring-offset-slate-950",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
