import type { JobImportWarning } from "@/features/jobs/importers/types";

export function getSuggestedCompanyFromIdentifier(identifier: string) {
  return identifier
    .split(/[-_]+/)
    .filter(Boolean)
    .map((segment) => `${segment.charAt(0).toLocaleUpperCase()}${segment.slice(1)}`)
    .join(" ");
}

export function getInferredCompanyWarning(
  sourceName: string,
  identifierName: string,
): JobImportWarning {
  return {
    code: "INFERRED_COMPANY",
    message: `Company was inferred from the ${sourceName} ${identifierName}. Verify it before saving.`,
  };
}
