import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  analyzeJobDescription: vi.fn(),
  analyzeJobMatch: vi.fn(),
  completeUsage: vi.fn(),
  extractProfile: vi.fn(),
  extractResumeText: vi.fn(),
  generateInterviewPrep: vi.fn(),
  jobFindFirst: vi.fn(),
  profileFindUnique: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
  releaseUsage: vi.fn(),
  requireUser: vi.fn(),
  reserveUsage: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/features/auth/require-user", () => ({
  requireUser: mocks.requireUser,
}));
vi.mock("@/features/ai-usage/quota", () => ({
  AiUsageFeature: {
    INTERVIEW_PREP: "INTERVIEW_PREP",
    JOB_ANALYSIS: "JOB_ANALYSIS",
    JOB_MATCH: "JOB_MATCH",
    PROFILE_EXTRACTION: "PROFILE_EXTRACTION",
    RESUME_EXTRACTION: "RESUME_EXTRACTION",
  },
  completeAiUsageReservation: mocks.completeUsage,
  releaseAiUsageReservation: mocks.releaseUsage,
  reserveAiUsage: mocks.reserveUsage,
}));
vi.mock("@/features/job-analysis/service", () => ({
  JobAnalysisServiceError: class JobAnalysisServiceError extends Error {},
  analyzeJobDescriptionWithOpenAI: mocks.analyzeJobDescription,
}));
vi.mock("@/features/job-match/service", () => ({
  JobMatchServiceError: class JobMatchServiceError extends Error {},
  analyzeProfileJobMatchWithOpenAI: mocks.analyzeJobMatch,
}));
vi.mock("@/features/interview-prep/service", () => ({
  InterviewPrepServiceError: class InterviewPrepServiceError extends Error {},
  generateInterviewPrepWithOpenAI: mocks.generateInterviewPrep,
}));
vi.mock("@/features/profiles/ai-service", () => ({
  ProfileExtractionServiceError: class ProfileExtractionServiceError extends Error {},
  extractProfileSuggestionsFromResumeText: mocks.extractProfile,
}));
vi.mock("@/features/profiles/resume-import", () => ({
  extractResumeTextFromUploadFile: mocks.extractResumeText,
}));
vi.mock("@/server/db/prisma", () => ({
  prisma: {
    job: { findFirst: mocks.jobFindFirst },
    userProfile: { findUnique: mocks.profileFindUnique },
  },
}));

import { analyzeJobDescription } from "@/features/job-analysis/actions";
import { analyzeJobMatch } from "@/features/job-match/actions";
import { generateInterviewPrep } from "@/features/interview-prep/actions";
import {
  extractProfileDetails,
  importResumeText,
} from "@/features/profiles/actions";

const rejectedDailyQuota = { reason: "DAILY_LIMIT", status: "rejected" } as const;
const reservedUsage = { reservationId: "reservation_1", status: "reserved" } as const;

function formData(values: Record<string, string | File>) {
  const data = new FormData();

  for (const [name, value] of Object.entries(values)) {
    data.set(name, value);
  }

  return data;
}

const ownedJob = {
  id: "job_owned",
  company: "Acme",
  title: "Engineer",
  remoteType: null,
  employmentType: null,
  description:
    "A sufficiently detailed job description for analysis that is deliberately longer than eighty characters.",
  analysis: {
    summary: "Summary",
    requiredSkills: [],
    preferredSkills: [],
    responsibilities: [],
    keywords: [],
    seniorityLevel: null,
  },
};

const profile = {
  id: "profile_owned",
  targetTitle: null,
  yearsOfExperience: null,
  skills: [],
  experienceSummary: null,
  resumeText:
    "Senior software engineer with experience delivering secure, user-focused web applications. Built TypeScript services, designed PostgreSQL-backed data models, and collaborated with product teams. Led migrations, documented operational processes, and shipped accessible React interfaces. Experienced with cloud deployment, testing, incident response, and mentoring teammates through complex technical decisions.",
  workPreferences: [],
};

describe("AI action quota boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "user_authenticated" });
    mocks.reserveUsage.mockResolvedValue(rejectedDailyQuota);
    mocks.jobFindFirst.mockResolvedValue(ownedJob);
    mocks.profileFindUnique.mockResolvedValue(profile);
    mocks.extractResumeText.mockResolvedValue({
      extractedText: profile.resumeText,
    });
  });

  it("rejects job analysis before OpenAI and ignores browser-supplied user or usage values", async () => {
    const state = await analyzeJobDescription(
      {},
      formData({
        jobId: "job_owned",
        userId: "user_other",
        usageCount: "0",
      }),
    );

    expect(mocks.reserveUsage).toHaveBeenCalledWith(
      "user_authenticated",
      "JOB_ANALYSIS",
    );
    expect(mocks.analyzeJobDescription).not.toHaveBeenCalled();
    expect(state.formError).toMatch(/today's AI analysis limit/i);
  });

  it("rejects job matching before OpenAI", async () => {
    const state = await analyzeJobMatch({}, formData({ jobId: "job_owned" }));

    expect(mocks.reserveUsage).toHaveBeenCalledWith(
      "user_authenticated",
      "JOB_MATCH",
    );
    expect(mocks.analyzeJobMatch).not.toHaveBeenCalled();
    expect(state.formError).toMatch(/profile comparison limit/i);
  });

  it("rejects interview prep before OpenAI", async () => {
    const state = await generateInterviewPrep(
      {},
      formData({ jobId: "job_owned" }),
    );

    expect(mocks.reserveUsage).toHaveBeenCalledWith(
      "user_authenticated",
      "INTERVIEW_PREP",
    );
    expect(mocks.generateInterviewPrep).not.toHaveBeenCalled();
    expect(state.formError).toMatch(/comparison\/prep limit/i);
  });

  it("rejects saved-profile extraction before OpenAI", async () => {
    const state = await extractProfileDetails({});

    expect(mocks.reserveUsage).toHaveBeenCalledWith(
      "user_authenticated",
      "PROFILE_EXTRACTION",
    );
    expect(mocks.extractProfile).not.toHaveBeenCalled();
    expect(state.formError).toMatch(/profile extraction limit/i);
  });

  it("rejects resume extraction before OpenAI", async () => {
    const resume = new File(["resume"], "resume.txt", { type: "text/plain" });
    const state = await importResumeText(
      {},
      formData({ resumeFile: resume }),
    );

    expect(mocks.reserveUsage).toHaveBeenCalledWith(
      "user_authenticated",
      "RESUME_EXTRACTION",
    );
    expect(mocks.extractProfile).not.toHaveBeenCalled();
    expect(state.formError).toMatch(/profile extraction limit/i);
  });

  it("completes a reservation only after a usable provider result", async () => {
    mocks.reserveUsage.mockResolvedValue(reservedUsage);
    mocks.completeUsage.mockResolvedValue(true);
    mocks.analyzeJobMatch.mockResolvedValue({
      overallFitSummary: "Based on your saved profile and this job's analysis, the fit is strong.",
      fitLevel: "STRONG",
      matchingSkills: [],
      missingOrWeakSkills: [],
      relevantProfileEvidence: [],
      resumeImprovementSuggestions: [],
      interviewPrepFocusAreas: [],
      warnings: [],
    });

    await analyzeJobMatch({}, formData({ jobId: "job_owned" }));

    expect(mocks.analyzeJobMatch).toHaveBeenCalledOnce();
    expect(mocks.completeUsage).toHaveBeenCalledWith("reservation_1");
    expect(mocks.releaseUsage).not.toHaveBeenCalled();
  });

  it("releases a reservation when the provider fails or times out", async () => {
    mocks.reserveUsage.mockResolvedValue(reservedUsage);
    mocks.analyzeJobMatch.mockRejectedValue(new Error("provider timeout"));

    await analyzeJobMatch({}, formData({ jobId: "job_owned" }));

    expect(mocks.completeUsage).not.toHaveBeenCalled();
    expect(mocks.releaseUsage).toHaveBeenCalledWith("reservation_1");
  });
});
