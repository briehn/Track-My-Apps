import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_1px_2px_rgba(2,6,23,0.7),0_10px_28px_rgba(2,6,23,0.45)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardProps) {
  return (
    <div
      className={["mb-4 space-y-1.5", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: CardProps) {
  return (
    <h2
      className={["text-base font-semibold text-slate-950", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: CardProps) {
  return (
    <p
      className={["text-sm leading-6 text-slate-600", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
