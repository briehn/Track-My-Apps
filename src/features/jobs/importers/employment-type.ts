export function normalizeImportedEmploymentType(value: string | null | undefined) {
  const normalizedValue = value
    ?.toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  switch (normalizedValue) {
    case "full time":
    case "fulltime":
    case "salaried full time":
      return "FULL_TIME" as const;
    case "part time":
    case "parttime":
      return "PART_TIME" as const;
    case "contract":
    case "contractor":
      return "CONTRACT" as const;
    case "intern":
    case "internship":
      return "INTERNSHIP" as const;
    case "temp":
    case "temporary":
      return "TEMPORARY" as const;
    default:
      return undefined;
  }
}
