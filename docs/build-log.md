# Build Log

This log tracks meaningful project progress by date.

It should document what changed, why it mattered, and what the next step is. It is not meant to list every tiny code edit.

---

## 2026-05-09

### Changes
- Ran a focused QA/polish pass on the transient profile-to-job match flow across schema normalization, server action ownership/scoping, service error handling, and job-detail UI integration.
- Hardened job-match summary normalization so reports are always explicitly framed as grounded in the saved profile plus this job's analysis, reducing overclaim risk if model wording drifts.
- Improved match report readability on narrow screens by enabling long-text wrapping in summary, warnings, and list-card content.
- Extended job-match schema tests to cover grounded summary normalization behavior while preserving existing dedupe/trim validation.
- Added production-only per-user daily usage protection for profile-to-job matching, with a durable `JobMatchRun` table that stores only `userId`, `jobId`, and `createdAt`.
- Reused the existing UTC-day helper pattern so job matching now blocks before OpenAI when a production user has already reached the daily comparison cap, while development remains unrestricted.
- Updated the README to document the new job-match usage tracking model and production limit behavior.
- Condensed the README into a recruiter-friendly overview that keeps the live app, setup, deployment, screenshots, and core architecture links while removing changelog-style detail.
- Fixed AI profile extraction normalization so common title variants (for example, Full Stack/Fullstack and Front End/Back End wording) map to predefined target-title options instead of incorrectly defaulting to Other.
- Added stronger years-of-experience normalization for extraction suggestions, including explicit handling for entry-level/no-professional-experience signals and clear range mapping (0-1, 1-2, 3-5, 6-9, 10+).
- Moved extraction suggestion apply-merging into a pure helper and added regression tests to ensure valid low experience ranges (including `ZERO_TO_ONE`) are applied over existing higher saved values.
- Ran a focused post-fix QA/polish pass for profile extraction mapping reliability and hardened edge handling for Front End/Frontend and Back End/Backend title variants.
- Added test coverage for those additional title variants and tightened enum-like years signal normalization to avoid missing valid values due to casing/spacing drift.
- Added authenticated CSV export for saved jobs with safe CSV escaping and view-aware filtering (`active` vs `archived`) from the jobs page.
- Added a protected `/jobs/export` route handler that enforces `requireUser()` ownership scoping and exports only the current user's job fields (plus notes count) without profile/resume or transient AI report data.
- Added focused unit coverage for CSV formatting and escaping behavior.
- Updated the roadmap to add formatted XLSX export as a future import/export refinement, with CSV preserved for compatibility and exports kept user-scoped.
- Added the first CSV job import workflow for authenticated users, with a dedicated `/jobs/import` page, upload step, column mapping, server-side preview validation, duplicate warnings, and explicit confirm import.
- Kept the first import milestone CSV-only and synchronous, with a 2 MB file limit, 500-row limit, required company/title mapping, and user-scoped duplicate detection based on URL or normalized company+title.
- Added focused unit coverage for CSV parsing, import header auto-mapping, and row validation/duplicate handling.
- Ran a focused QA/security/polish pass on CSV import and fixed two gaps: server-side CSV text parsing now enforces the 2 MB size cap (including confirm/import revalidation), and duplicate detection now also flags repeated rows within the same CSV upload.
- Expanded CSV import tests to cover CRLF parsing, oversized CSV text rejection, and same-file duplicate classification.
- Ran a final project-readiness review across public docs, package metadata, key routes, and screenshots; updated stale homepage/sign-in copy, corrected roadmap status drift, and renamed the package metadata from the old prototype name to `track-my-apps`.
- Refreshed the README screenshot section to highlight the strongest current recruiter-facing views: dashboard, CSV import preview, and AI profile extraction.
- Ran a focused visual/demo polish pass across homepage, sign-in, dashboard shell, jobs, job detail AI sections, profile, and CSV import screens to improve spacing, section hierarchy, and mobile button behavior without changing product logic.
- Updated key screenshot-facing UI details, including cleaner AI section framing, improved import-step card readability, better action-button wrapping on narrow widths, and a clearer mobile nav trigger label.
- Refactored job detail AI presentation into one compact `AI insights` area with in-place tabs (`Job analysis` / `Profile match`) and collapsible deep-detail sections to reduce clutter and scrolling after analysis/matching is complete.
- Moved the saved job description into the main top job-information card to reduce page length and keep core role context visible before AI/notes sections.
- Improved job management UX by promoting archive as the primary quick action and moving permanent delete behind a compact "Danger zone" disclosure while keeping checkbox confirmation safety.
- Simplified the app-shell navigation by removing `Add Job` and `Profile` from the left rail, and moving `Profile` into the top-right header near `Sign out` for a cleaner primary nav.
- Revalidated with `npm run test`, `npm run lint`, and `npm run build`.

### Notes
- Match reports remain transient and are still not saved to the database; only successful comparison runs are tracked for daily limiting.
- This pass introduced a Prisma schema change and migration for durable job-match usage tracking.
- No new dependencies, environment variables, or persistence paths were added.
- CSV import remains user-scoped and transient at preview-time; no import session history or raw CSV storage was added.
- The screenshot set is now the main remaining presentation gap because it still reflects the old name and pre-AI/import UI.

### Next Step
- Run a quick manual dashboard smoke test covering the three prerequisite states, the production daily-limit message, and one full compare flow in desktop + mobile viewport sizes.


## 2026-05-08

### Changes
- Added the first transient profile-to-job matching slice on the job detail page, with a manual `Compare my profile` action beside the existing job analysis panel.
- Introduced a new `job-match` feature folder with a structured OpenAI service, read-only server action, and Zod normalization for fit summaries, fit levels, evidence, missing skills, suggestions, prep topics, and warnings.
- Kept match reports out of the database in this MVP so the comparison stays derived, cheap to iterate on, and clearly separate from canonical user/job data.
- Added prerequisite states for missing `JobAnalysis` and missing `UserProfile`, while still allowing matching without saved `resumeText` and surfacing a completeness warning instead.
- Added focused tests for job-match schema normalization, warning merging, and resume-text input capping.
- Updated the README to reflect the new transient profile-to-job match capability and current source organization.

### Notes
- The match prompt is explicitly constrained to avoid fabricating skills, years, certifications, projects, or achievements and to treat missing evidence as missing evidence.
- Resume improvement suggestions are intentionally framed as safe guidance such as clarifying or highlighting existing experience if true, rather than inventing resume content.
- This slice does not add saved match history, durable usage limits, or one-click resume edits.

### Next Step
- Decide whether the next iteration should improve report quality first or introduce saved match history and invalidation rules after the transient flow proves useful.

## 2026-05-07

### Changes
- Ran a focused security review across Next.js route handlers, server actions, Prisma access patterns, rendering sinks, URL handling, auth scoping, and logging.
- Hardened external URL validation so job and profile URLs only accept `http://` or `https://`, closing the click-through `javascript:` URL risk that Zod's generic URL validator would otherwise allow.
- Added a defensive render-time URL check on the job detail page so previously saved unsafe URLs are not emitted into an anchor tag.
- Tightened job-analysis persistence failure logging to emit structured diagnostics instead of a raw error object.
- Added regression coverage for unsafe URL rejection in job/profile validation and AI profile suggestion normalization.
- Added app-level and authenticated-dashboard not-found pages so invalid URLs now resolve to a branded recovery experience instead of the browser default 404.
- Updated the README to document the new not-found experience as an implemented feature.

### Notes
- The review found no raw SQL usage, no dangerous HTML rendering, and no missing user-ownership scoping in the current jobs, notes, profile, or AI action paths.
- React text rendering continues to protect saved notes, job descriptions, resume text, and AI-generated summaries from direct HTML/script injection as long as the app does not introduce raw HTML rendering later.

### Next Step
- Keep the same review bar when adding URL importing, richer AI output, or any new public API routes, because those features would materially expand the attack surface.

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
- Added AI profile extraction from saved resume text with OpenAI-backed structured suggestions, server-side validation/normalization, and a manual review/apply step that does not write directly to `UserProfile`.
- Kept extraction action-only for MVP so AI suggestions stay transient until the user applies them and explicitly saves through the existing profile form flow.

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
