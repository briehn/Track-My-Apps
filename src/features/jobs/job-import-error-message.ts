export function getJobImportFailureMessage(code: string) {
  if (code === "INVALID_URL") {
    return "Enter a valid http:// or https:// job URL.";
  }

  if (code === "UNSAFE_URL") {
    return "This URL can't be imported.";
  }

  if (code === "UNSUPPORTED_SOURCE") {
    return "This job site isn't supported for automatic import yet. You can still add the job manually.";
  }

  return "We couldn't import this posting. You can try again or enter the details manually.";
}
