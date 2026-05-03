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

  jobs          Job[]
  notes         Note[]
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
  analysis        JobAnalysis?

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

enum EmploymentType {
  FULL_TIME
  PART_TIME
  CONTRACT
  INTERNSHIP
  TEMPORARY
}
```

## Authentication Models

If the app uses Auth.js or NextAuth with the Prisma adapter, add the standard auth models required by the selected provider setup, such as `Account`, `Session`, `VerificationToken`, and possibly `Authenticator`.

Keep authentication tables conceptually separate from product tables. The product domain should depend on the authenticated `User.id`, not on provider-specific account records.

## Ownership Rules

User-owned data is the central security boundary.

- `Job.userId` defines the owner of a saved job.
- `Note.userId` defines the owner of a note and should match the owner of the related job.
- `JobAnalysis` is owned through its required one-to-one `Job` relation.
- Every query that reads or mutates jobs, notes, or analysis must be scoped by the authenticated user's id.
- Authentication proves who the user is. Authorization still needs explicit ownership checks in queries and server actions.

For note creation, validate both `jobId` and ownership before inserting the note. Do not trust a submitted `userId` from form data.

## Cascades

The schema uses cascade deletes from `User` to `Job` and `Note`, and from `Job` to `Note` and `JobAnalysis`.

This is appropriate for MVP because the data is personal workspace data. If the product later adds team accounts, audit logs, or shared jobs, deletion rules should be revisited before shipping those features.

## Indexes

The MVP indexes support the first expected access patterns:

- `@@index([userId])` for owner-scoped queries.
- `@@index([userId, status])` for dashboard counts and status filtering.
- `@@index([userId, createdAt])` for recent jobs.
- `@@index([jobId])` on notes for loading the job detail page.

Avoid adding speculative indexes until real queries require them.

## Validation Notes

Use Zod schemas at server-action and route-handler boundaries. Prisma types describe stored data, but they do not replace input validation.

Important validation cases:

- Required job fields: `company`, `title`.
- URL format for `url` when provided.
- Salary ranges where `salaryMin <= salaryMax` when both are provided.
- Status transitions should use `ApplicationStatus`, not arbitrary strings.
- Date fields should be parsed and normalized intentionally before persistence.
