import type { SelectHTMLAttributes } from "react";

type ProfileSelectProps = Readonly<
  SelectHTMLAttributes<HTMLSelectElement>
>;

export function ProfileSelect({ className, ...props }: ProfileSelectProps) {
  return (
    <select
      className={[
        "mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950",
        "focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200",
        "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
        "dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-700",
        "dark:disabled:bg-slate-800 dark:disabled:text-slate-400",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
