import "server-only";

import OpenAI from "openai";

import { OPENAI_REQUEST_TIMEOUT_MS } from "@/features/ai-usage/policy";

export function createOpenAiClient(apiKey: string) {
  return new OpenAI({
    apiKey,
    maxRetries: 0,
    timeout: OPENAI_REQUEST_TIMEOUT_MS,
  });
}
