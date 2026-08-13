type StructuredWorkplaceType = "hybrid" | "on-site" | "onsite" | "remote" | "unspecified";

export function inferImportedRemoteType(options: {
  description?: string | null;
  location?: string | null;
  workplaceType?: StructuredWorkplaceType | null;
}) {
  if (options.workplaceType === "remote") {
    return "REMOTE" as const;
  }
  if (options.workplaceType === "hybrid") {
    return "HYBRID" as const;
  }
  if (options.workplaceType === "on-site" || options.workplaceType === "onsite") {
    return "ONSITE" as const;
  }

  const normalizedLocation = options.location?.toLocaleLowerCase() ?? "";
  if (/\bremote\b/.test(normalizedLocation)) {
    return "REMOTE" as const;
  }
  if (/\bhybrid\b/.test(normalizedLocation)) {
    return "HYBRID" as const;
  }

  const normalizedDescription = options.description?.toLocaleLowerCase() ?? "";
  const hasExplicitHybridRoleStatement =
    /\b(?:this|the)\s+(?:role|position|job)\s+(?:is|will be|requires?)\b[^.\n]{0,120}\bhybrid\b/.test(
      normalizedDescription,
    ) ||
    /\b(?:this|the)\s+(?:role|position|job)\s+requires?\b[^.\n]{0,120}\b(?:day|days|week)\b[^.\n]{0,120}\b(?:in[- ]office|office)\b/.test(
      normalizedDescription,
    );

  return hasExplicitHybridRoleStatement ? "HYBRID" : undefined;
}
