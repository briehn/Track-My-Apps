import { z } from "zod";

const SAFE_EXTERNAL_PROTOCOLS = new Set(["http:", "https:"]);

export function isSafeExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return SAFE_EXTERNAL_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

export const safeExternalUrlSchema = z
  .string()
  .trim()
  .url("Enter a valid URL.")
  .refine(isSafeExternalUrl, {
    message: "Enter a valid http:// or https:// URL.",
  });
