# Build Log

This log tracks meaningful project progress by date.

It should document what changed, why it mattered, and what the next step is. It is not meant to list every tiny code edit.

---

## 2026-05-05

### Changes
- Ran a focused AI analysis stability checkpoint after the Prisma usage-metadata compatibility fixes.
- Verified ownership checks, description guards, daily usage limiting, and the `JobAnalysis` / `JobAnalysisRun` save flow.
- Hardened unexpected provider-error logging so only safe structured diagnostics are emitted.
- Revalidated the project with `npm run lint` and `npm run build`.
- Added the first automated test setup with Vitest and path-alias support for TypeScript feature-module unit tests.
- Added focused unit coverage for job schemas, status helpers, job-analysis description guards, normalization, and extracted UTC usage-limit helpers.
- Refreshed the README to describe the deployed MVP, implemented AI analysis, usage protections, Vitest coverage, and the current post-MVP roadmap.

### Notes
- The save path remains compatible with environments that do not support optional usage metadata fields yet.
- Unexpected provider failures now carry less risk of exposing oversized or sensitive payload details in logs.
- The first test phase intentionally stays at the pure helper/schema layer and avoids mocking Prisma, NextAuth, or full server-action flows.

### Next Step
- Run the unit tests in CI and add a small manual smoke pass for auth and AI analysis in the deployed/runtime environment.

## 2026-05-06

### Changes
- Added a `UserProfile` Prisma model with a one-to-one `User` relation for a single canonical career profile per account.
- Built the authenticated `/profile` page inside the dashboard shell with a private profile form for target role, work preferences, experience, skills, resume text, and career links.
- Added authenticated profile query and upsert server action paths that derive ownership exclusively from `requireUser()`.
- Added Zod-based profile validation plus skills normalization from comma/newline input into a deduped string array.
- Added focused Vitest coverage for profile schema normalization and validation behavior.
- Updated schema, roadmap, and README documentation to reflect the new profile foundation milestone.
- Refined the profile UX to use predefined target-title options, categorical experience ranges, suggested location phrases, and multi-select work preferences backed by schema changes.
- Reverted custom Prisma dev singleton schema-signature invalidation and returned to the standard Prisma singleton pattern to keep setup simple and avoid reliance on generated metadata internals.
- Added a short README recovery note for stale local Prisma Client issues after schema changes (`prisma generate`, restart dev server, clear `.next` if needed).
- Fixed a profile-save regression caused by conditionally missing `targetTitleOther` form data failing optional-string validation (`null` vs `undefined` handling).
- Replaced the bottom-only profile submit path with a dirty-state floating save/discard action bar that stays accessible while scrolling.
- Added profile schema coverage for the missing `targetTitleOther` path when a predefined target title is selected.

### Notes
- The milestone intentionally stops at profile storage and validation; no resume uploads, parsing, matching, or public sharing were added.
- Resume text remains private account data and is not logged or accepted with a client-supplied `userId`.
- Location preference intentionally remains a text field with suggestions so the app stays globally usable instead of forcing a brittle hard-coded geography list.

### Next Step
- Add the next profile-foundation slice only after deciding how repeatable project entries should be modeled without overcomplicating the canonical profile.

## 2026-05-03

### Changes
- Created the project planning docs, defined MVP scope, and established the architecture/schema/roadmap/decision doc structure.
- Added the initial Prisma migration and aligned Prisma 7 datasource configuration for CLI migrations vs app runtime.
- Wired NextAuth with Prisma, Google OAuth, database sessions, the App Router auth route, and the reusable `requireUser()` helper.
- Added the initial sign-in flow and protected shell, then replaced placeholders with the core jobs dashboard, list, details, edit, archive/delete, and notes workflows.
- Tightened validation and UX for job creation, status updates, responsive spacing, empty states, and the main dashboard/job detail layouts.
- Completed the first portfolio-readiness pass with a reviewer-facing README, deployment notes, screenshot placeholders, and accessibility refinements.
- Polished the sign-in page, cursor behavior, and auth startup errors so the app reads more intentionally while staying predictable for users.
- Added explicit dashboard typing and Prisma-safe status handling to avoid `any` leakage and deployment-specific type failures.
- Hardened deployment configuration by requiring `DATABASE_URL` and `NEXTAUTH_SECRET`, targeting Node 22, and generating Prisma Client during install.
- Added the public homepage and reworked mobile navigation so signed-out users get a clear entry point and signed-in users get a compact app shell.
- Implemented AI job analysis with OpenAI, prompt tuning, production-only usage limits, and a UI that explains character and daily analysis limits.
- Improved AI analysis quality and resilience with stricter extraction rules, clearer failure mapping, structured logs, and retry guidance.
- Added optional usage metadata capture for analysis runs, plus runtime compatibility handling so saves keep working across schema/client alignment changes.

### Notes
- The MVP focus remains the tracker first, with AI layered in after the core app pieces are stable.
- The initial migration established the auth-adjacent tables, job tracking tables, notes, job analysis placeholder, enums, indexes, and cascade relationships.
- Server-side ownership checks continue to derive `userId` from `requireUser()` and scope all job reads/writes to the authenticated user.
- Archived jobs remain hidden from the default list but accessible through the archived view.
- Dashboard summaries continue to exclude archived jobs from active totals, recent jobs, and upcoming reminders while still showing an archived count.
- The README still separates implemented tracker features from planned AI and resume features and documents local setup plus Google OAuth callback guidance.
- AI analysis still skips overlong descriptions and production users who hit the daily limit before calling OpenAI.
- Logging and save-failure handling still distinguish provider failures, schema/client mismatch, and genuine persistence failures.

### Next Step
- Validate the app one more time with lint/build, then capture screenshots or deploy a demo when ready.
