import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-md border border-slate-200 bg-white p-5 shadow-sm",
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
      className={["mb-4 space-y-1", className].filter(Boolean).join(" ")}
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
