type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl dark:text-white">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-pretty text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
          {description}
        </p>
      ) : null}
    </div>
  );
}
