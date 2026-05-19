import { describe, expect, it } from "vitest";

import {
  detectResumeImportFormat,
  MAX_RESUME_UPLOAD_BYTES,
  ResumeImportError,
  extractResumeTextFromUploadFile,
} from "@/features/profiles/resume-import";

describe("detectResumeImportFormat", () => {
  it("prefers file extension when available", () => {
    expect(detectResumeImportFormat("resume.TXT", "application/octet-stream")).toBe(
      "txt",
    );
    expect(detectResumeImportFormat("resume.docx", "")).toBe("docx");
    expect(detectResumeImportFormat("resume.pdf", "application/pdf")).toBe("pdf");
  });

  it("falls back to mime type when extension is missing", () => {
    expect(detectResumeImportFormat("resume", "text/plain")).toBe("txt");
    expect(
      detectResumeImportFormat(
        "resume",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ).toBe("docx");
    expect(detectResumeImportFormat("resume", "application/pdf")).toBe("pdf");
  });

  it("returns null for unsupported formats", () => {
    expect(detectResumeImportFormat("resume.rtf", "application/rtf")).toBe(null);
  });

  it("returns null when extension and mime type conflict", () => {
    expect(detectResumeImportFormat("resume.pdf", "text/plain")).toBe(null);
  });
});

describe("extractResumeTextFromUploadFile", () => {
  it("rejects oversized files before extraction", async () => {
    const file = new File([new Uint8Array(MAX_RESUME_UPLOAD_BYTES + 1)], "resume.txt", {
      type: "text/plain",
    });

    await expect(extractResumeTextFromUploadFile(file)).rejects.toMatchObject({
      code: "FILE_TOO_LARGE",
    } satisfies Partial<ResumeImportError>);
  });

  it("extracts and normalizes txt resume content", async () => {
    const file = new File(["First line\r\n\r\n\r\nSecond line\t \n"], "resume.txt", {
      type: "text/plain",
    });

    const result = await extractResumeTextFromUploadFile(file);

    expect(result.format).toBe("txt");
    expect(result.extractedText).toBe("First line\n\nSecond line");
  });

  it("rejects unsupported file types safely", async () => {
    const file = new File(["{\\rtf1 test}"], "resume.rtf", {
      type: "application/rtf",
    });

    await expect(extractResumeTextFromUploadFile(file)).rejects.toMatchObject({
      code: "UNSUPPORTED_FILE_TYPE",
    } satisfies Partial<ResumeImportError>);
  });

  it("rejects files that contain no readable extracted text", async () => {
    const file = new File(["   \n\t  "], "resume.txt", {
      type: "text/plain",
    });

    await expect(extractResumeTextFromUploadFile(file)).rejects.toMatchObject({
      code: "EMPTY_EXTRACTED_TEXT",
    } satisfies Partial<ResumeImportError>);
  });
});
