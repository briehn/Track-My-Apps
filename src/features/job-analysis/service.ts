import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  aiJobAnalysisResponseSchema,
  normalizeJobAnalysis,
  type NormalizedJobAnalysis,
} from "@/features/job-analysis/schemas";

type JobAnalysisErrorCode =
  | "NOT_CONFIGURED"
  | "PROVIDER_FAILURE"
  | "MALFORMED_OUTPUT";

export class JobAnalysisServiceError extends Error {
  constructor(
    public code: JobAnalysisErrorCode,
    message: string,
  ) {
    super(message);
  }
}

function requiredEnv(name: "OPENAI_API_KEY" | "OPENAI_MODEL") {
  const value = process.env[name];

  if (!value) {
    throw new JobAnalysisServiceError(
      "NOT_CONFIGURED",
      `Missing required environment variable: ${name}`,
    );
  }

  return value;
}

export async function analyzeJobDescriptionWithOpenAI(
  description: string,
): Promise<NormalizedJobAnalysis> {
  const openai = new OpenAI({
    apiKey: requiredEnv("OPENAI_API_KEY"),
  });

  try {
    const response = await openai.responses.parse({
      model: requiredEnv("OPENAI_MODEL"),
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "You extract structured job analysis data from a saved job description.",
                "Use only information explicitly stated in the description.",
                "Do not invent technologies, requirements, salary, benefits, or responsibilities.",
                "Keep output concise and useful for job seekers.",
                "Category rules:",
                "requiredSkills: include only explicit required qualifications such as technologies, languages, frameworks, infrastructure, data/database skills, role qualifications, and required experience areas.",
                "preferredSkills: include only explicitly preferred, nice-to-have, bonus, or optional qualifications.",
                "responsibilities: include only actions the person will perform in the role.",
                "keywords: include searchable technologies, domains, systems, tools, and important nouns from the posting.",
                "Do not place vague soft traits like ownership, collaboration, communication, clean code, or maintainable code into requiredSkills unless framed as a concrete engineering practice tied to specific work.",
                "If a skill/technology is mentioned only in company background text and not in role requirements, prefer keywords over requiredSkills.",
                "Preserve either/or requirements accurately, for example: distributed systems or cloud infrastructure.",
                "Prefer specific tools, technologies, domains, and systems over vague terms when specific wording exists.",
                "Infer seniorityLevel conservatively when years are explicit:",
                "0-2 years => Junior-level, 3-5 years => Mid-level, 6+ years => Senior-level.",
                "If years are not explicit and level is unclear, return null for seniorityLevel.",
                "summary must be factual, brief, and based only on the posting.",
              ].join(" "),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "Analyze the following saved job description.",
                "Use the category rules exactly.",
                "Return structured output only from the job description text below.",
                "JOB_DESCRIPTION_START",
                description,
                "JOB_DESCRIPTION_END",
              ].join("\n"),
            },
          ],
        },
      ],
      text: {
        format: zodTextFormat(aiJobAnalysisResponseSchema, "job_analysis"),
      },
    });

    if (!response.output_parsed) {
      throw new JobAnalysisServiceError(
        "MALFORMED_OUTPUT",
        "OpenAI did not return parsed job analysis output.",
      );
    }

    return normalizeJobAnalysis(response.output_parsed);
  } catch (error) {
    if (error instanceof JobAnalysisServiceError) {
      throw error;
    }

    throw new JobAnalysisServiceError(
      "PROVIDER_FAILURE",
      "OpenAI job analysis request failed.",
    );
  }
}
