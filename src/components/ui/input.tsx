import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={[
        "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950",
        "placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200",
        "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
