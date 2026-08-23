const FORMULA_PREFIX = /^[=+\-@]/;
const LEADING_SPREADSHEET_IGNORABLE_CHARACTERS = /^[\u0000-\u0020]+/;

/**
 * Preserves export text while preventing spreadsheet applications from treating
 * a user-controlled cell as a formula. The apostrophe is an established
 * spreadsheet text marker and is added only at serialization time.
 */
export function sanitizeSpreadsheetCellText(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "";
  }

  const firstMeaningfulValue = trimmedValue.replace(LEADING_SPREADSHEET_IGNORABLE_CHARACTERS, "");
  return FORMULA_PREFIX.test(firstMeaningfulValue) ? `'${trimmedValue}` : trimmedValue;
}
