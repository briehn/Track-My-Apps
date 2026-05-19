import { MAX_PROFILE_RESUME_EXTRACTION_CHARS } from "@/features/profiles/schemas";

export const MAX_RESUME_UPLOAD_BYTES = 3 * 1024 * 1024;

export const SUPPORTED_RESUME_FILE_EXTENSIONS = [
  ".txt",
  ".docx",
  ".pdf",
] as const;

export type ResumeImportFormat = "txt" | "docx" | "pdf";

const RESUME_IMPORT_FORMAT_BY_EXTENSION: Record<string, ResumeImportFormat> = {
  ".txt": "txt",
  ".docx": "docx",
  ".pdf": "pdf",
};

const RESUME_IMPORT_FORMAT_BY_MIME_TYPE: Record<string, ResumeImportFormat> = {
  "text/plain": "txt",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/pdf": "pdf",
};

export class ResumeImportError extends Error {
  constructor(
    public code:
      | "EMPTY_FILE"
      | "FILE_TOO_LARGE"
      | "UNSUPPORTED_FILE_TYPE"
      | "EXTRACTION_FAILED"
      | "EMPTY_EXTRACTED_TEXT"
      | "TEXT_TOO_LONG",
    message: string,
  ) {
    super(message);
  }
}

function getFileExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex < 0) {
    return "";
  }

  return fileName.slice(lastDotIndex).toLocaleLowerCase();
}

export function detectResumeImportFormat(
  fileName: string,
  mimeType: string,
): ResumeImportFormat | null {
  const extension = getFileExtension(fileName);
  const extensionMatch = RESUME_IMPORT_FORMAT_BY_EXTENSION[extension];
  const normalizedMimeType = mimeType.toLocaleLowerCase().trim();
  const mimeTypeMatch = RESUME_IMPORT_FORMAT_BY_MIME_TYPE[normalizedMimeType];

  if (extensionMatch && mimeTypeMatch && extensionMatch !== mimeTypeMatch) {
    return null;
  }

  if (extensionMatch) {
    return extensionMatch;
  }

  return mimeTypeMatch ?? null;
}

function normalizeExtractedResumeText(value: string) {
  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractTextByFormat(format: ResumeImportFormat, buffer: Buffer) {
  if (format === "txt") {
    return buffer.toString("utf-8");
  }

  if (format === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  const pdfParse = await import("pdf-parse");
  const PDFParse = pdfParse.PDFParse;
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    try {
      await parser.destroy();
    } catch {
      // Ignore parser teardown failures after extraction attempt.
    }
  }
}

export async function extractResumeTextFromUploadFile(file: File) {
  if (file.size <= 0) {
    throw new ResumeImportError("EMPTY_FILE", "The selected file is empty.");
  }

  if (file.size > MAX_RESUME_UPLOAD_BYTES) {
    throw new ResumeImportError(
      "FILE_TOO_LARGE",
      `Resume files must be ${Math.floor(MAX_RESUME_UPLOAD_BYTES / (1024 * 1024))} MB or smaller.`,
    );
  }

  const format = detectResumeImportFormat(file.name, file.type);
  if (!format) {
    throw new ResumeImportError(
      "UNSUPPORTED_FILE_TYPE",
      "Unsupported file type. Upload a .txt, .docx, or .pdf resume.",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let extractedText = "";
  try {
    extractedText = await extractTextByFormat(format, buffer);
  } catch {
    throw new ResumeImportError(
      "EXTRACTION_FAILED",
      "We could not extract text from that file. Try another file or paste resume text manually.",
    );
  }

  const normalizedText = normalizeExtractedResumeText(extractedText);
  if (!normalizedText) {
    throw new ResumeImportError(
      "EMPTY_EXTRACTED_TEXT",
      "No readable text was found in this file.",
    );
  }

  if (normalizedText.length > MAX_PROFILE_RESUME_EXTRACTION_CHARS) {
    throw new ResumeImportError(
      "TEXT_TOO_LONG",
      `Extracted resume text is too long (${normalizedText.length.toLocaleString()} characters). Keep it under ${MAX_PROFILE_RESUME_EXTRACTION_CHARS.toLocaleString()} characters.`,
    );
  }

  return {
    extractedText: normalizedText,
    format,
  };
}
