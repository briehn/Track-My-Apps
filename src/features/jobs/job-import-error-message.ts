export function getJobImportFailureMessage(code: string) {
  if (code === "INVALID_URL") {
    return "Enter a valid http:// or https:// job URL.";
  }

  if (code === "MALFORMED_URL") {
    return "Remove escaped backslashes from the job URL and paste the browser URL directly.";
  }

  if (code === "UNSAFE_URL") {
    return "This URL can't be imported.";
  }

  if (code === "POSTING_UNAVAILABLE") {
    return "This job posting is no longer available. You can still enter the job manually if you previously applied to it.";
  }

  if (code === "UNSUPPORTED_SOURCE") {
    return "This job site isn't supported for automatic import yet. You can still add the job manually.";
  }

  return "We couldn't import this posting. You can try again or enter the details manually.";
}
