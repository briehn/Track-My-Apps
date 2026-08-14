# Schema

This document is the canonical data-model reference for the MVP. The goal is a normalized Prisma schema that supports a polished application tracker now and leaves room for AI-assisted analysis later.

## Product Models

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  profile       UserProfile?
  jobs          Job[]
  notes         Note[]
  contacts      JobContact[]
  analysisRuns  JobAnalysisRun[]
  matchRuns     JobMatchRun[]
}

model UserProfile {
  id                 String      @id @default(cuid())
  userId             String      @unique
  targetTitle        String?
  locationPreference String?
  workPreferences    RemoteType[] @default([])
  yearsOfExperience  ExperienceRange?
  skills             String[]    @default([])
  experienceSummary  String?
  resumeText         String?
  portfolioUrl       String?
  githubUrl          String?
  linkedinUrl        String?
  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt

  user               User        @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Job {
  id              String            @id @default(cuid())
  userId          String
  company         String
  title           String
  location        String?
  remoteType      RemoteType?
  employmentType  EmploymentType?
  source          String?
  url             String?
  salaryMin       Int?
  salaryMax       Int?
  salaryCurrency  String?
  description     String?
  status          ApplicationStatus @default(SAVED)
  deadline        DateTime?
  appliedAt       DateTime?
  followUpAt      DateTime?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  notes           Note[]
  contacts        JobContact[]
  analysis        JobAnalysis?
  analysisRuns    JobAnalysisRun[]
  matchRuns       JobMatchRun[]

  @@index([userId])
  @@index([userId, status])
  @@index([userId, createdAt])
}

model Note {
  id        String   @id @default(cuid())
  userId    String
  jobId     String
  body      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  job       Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([jobId])
}

model JobContact {
  id              String         @id @default(cuid())
  userId          String
  jobId           String
  name            String
  title           String?
  company         String?
  profileUrl      String?
  email           String?
  contactType     JobContactType
  relevanceNotes  String?
  outreachStatus  OutreachStatus @default(NOT_CONTACTED)
  lastContactedAt DateTime?
  followUpAt      DateTime?
  notes           String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  user            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  job             Job            @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([jobId])
  @@index([userId, followUpAt])
}

model JobAnalysis {
  id               String   @id @default(cuid())
  jobId            String   @unique
  summary          String?
  requiredSkills   String[]
  preferredSkills  String[]
  responsibilities String[]
  keywords         String[]
  seniorityLevel   String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  job              Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
}

model JobAnalysisRun {
  id           String   @id @default(cuid())
  userId       String
  jobId        String
  model        String?
  inputTokens  Int?
  outputTokens Int?
  totalTokens  Int?
  createdAt    DateTime @default(now())

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  job          Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@index([jobId])
}

model JobMatchRun {
  id        String   @id @default(cuid())
  userId    String
  jobId     String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  job       Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@index([jobId])
}

enum ApplicationStatus {
  SAVED
  APPLIED
  INTERVIEWING
  OFFER
  REJECTED
  ARCHIVED
}

enum RemoteType {
  ONSITE
  HYBRID
  REMOTE
}

enum ExperienceRange {
  ZERO_TO_ONE
  ONE_TO_TWO
  THREE_TO_FIVE
  SIX_TO_NINE
  TEN_PLUS
}

enum EmploymentType {
  FULL_TIME
  PART_TIME
  CONTRACT
  INTERNSHIP
  TEMPORARY
}

enum JobContactType {
  RECRUITER
  HIRING_MANAGER
  ENGINEER
  CONNECTION
  LEADERSHIP
  OTHER
}

enum OutreachStatus {
  NOT_CONTACTED
  CONTACTED
  RESPONDED
  FOLLOW_UP_NEEDED
  CLOSED
}
```

## Authentication Models

If the app uses Auth.js or NextAuth with the Prisma adapter, add the standard auth models required by the selected provider setup, such as `Account`, `Session`, `VerificationToken`, and possibly `Authenticator`.

Keep authentication tables conceptually separate from product tables. The product domain should depend on the authenticated `User.id`, not on provider-specific account records.

## Ownership Rules

User-owned data is the central security boundary.

- `Job.userId` defines the owner of a saved job.
- `UserProfile.userId` defines the owner of the canonical profile and enforces one profile per user.
- `Note.userId` defines the owner of a note and should match the owner of the related job.
- `JobContact.userId` defines the owner of a manually saved contact and must match the owner of its related job.
- `JobAnalysis` is owned through its required one-to-one `Job` relation.
- `JobAnalysisRun` and `JobMatchRun` are owned through both `userId` and the related `jobId`, and should only ever be created from authenticated server-side flows.
- Every query that reads or mutates profiles, jobs, notes, contacts, or analysis must be scoped by the authenticated user's id.
- Authentication proves who the user is. Authorization still needs explicit ownership checks in queries and server actions.

For note/contact creation, validate both `jobId` and ownership before inserting. Contact edits, status updates, and deletions must scope both the contact and its related job to the authenticated user. For profile saves, derive `userId` only from the authenticated session. Do not trust a submitted `userId` from form data.

## Cascades

The schema uses cascade deletes from `User` to `UserProfile`, `Job`, `Note`, `JobContact`, `JobAnalysisRun`, and `JobMatchRun`, and from `Job` to `Note`, `JobContact`, `JobAnalysis`, `JobAnalysisRun`, and `JobMatchRun`.

This is appropriate for MVP because the data is personal workspace data. If the product later adds team accounts, audit logs, or shared jobs, deletion rules should be revisited before shipping those features.

## Indexes

The MVP indexes support the first expected access patterns:

- `@@index([userId])` for owner-scoped queries.
- `@@index([userId, status])` for dashboard counts and status filtering.
- `@@index([userId, createdAt])` for recent jobs.
- `@@index([jobId])` on notes for loading the job detail page.
- `@@index([jobId])` on contacts for loading the Job Details networking card, and `@@index([userId, followUpAt])` for a future owner-scoped contact reminder view.
- `@@index([userId, createdAt])` on AI usage-run tables for efficient daily per-user limit checks.
- `@@index([jobId])` on AI usage-run tables for job-scoped drill-in or cleanup operations.
- `@unique` on `UserProfile.userId` for one canonical profile lookup per authenticated user.

Avoid adding speculative indexes until real queries require them.

## Validation Notes

Use Zod schemas at server-action and route-handler boundaries. Prisma types describe stored data, but they do not replace input validation.

Important validation cases:

- Optional profile text fields should trim empty strings to `undefined`.
- Profile target titles should come from a predefined list, with an explicit `Other` path for uncommon roles.
- Profile `locationPreference` should stay globally usable, so suggested phrases are appropriate while the stored field remains freeform text.
- Profile `workPreferences` should validate as a deduped `RemoteType[]`.
- `yearsOfExperience` should validate as an `ExperienceRange` enum value when provided.
- Profile `skills` input should normalize comma/newline text into a deduped `String[]`.
- Profile URLs should be validated when provided.
- Required job fields: `company`, `title`.
- URL format for `url` when provided.
- Salary ranges where `salaryMin <= salaryMax` when both are provided.
- Status transitions should use `ApplicationStatus`, not arbitrary strings.
- Contact type and outreach state should use `JobContactType` and `OutreachStatus`, not arbitrary strings.
- Contact profile URLs must be optional but restricted to safe HTTP(S) URLs; contact emails are manually entered only.
- Date fields should be parsed and normalized intentionally before persistence.
