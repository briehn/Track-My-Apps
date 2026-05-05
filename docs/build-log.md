# Build Log

This log tracks meaningful project progress by date.

It should document what changed, why it mattered, and what the next step is. It is not meant to list every tiny code edit.

---

## 2026-05-05

### Changes
- Ran a focused AI analysis stability checkpoint after Prisma usage-metadata compatibility fixes.
- Verified ownership checks, description guards, production usage limiting, and analysis persistence flow (`JobAnalysis` upsert + `JobAnalysisRun` create).
- Hardened unexpected provider-error logging in the job-analysis action to avoid logging raw error objects and keep diagnostics to safe structured fields.
- Revalidated the project with `npm run lint` and `npm run build`.

### Notes
- The save path remains compatible with environments that may not support optional usage metadata fields yet.
- AI analysis now has lower risk of accidentally logging oversized or sensitive provider error payloads during unexpected failures.

### Next Step
- Run a quick manual smoke test for first-run analysis and re-analysis on a real job record in the deployed/runtime environment.

## 2026-05-03

### Changes
- Created initial project planning documents.
- Defined MVP scope for AI Job Search Copilot.
- Established documentation structure for architecture, schema, roadmap, and decision records.
- Added guidance for AI-assisted development workflow.
- Created and applied the initial Prisma migration against PostgreSQL.
- Updated Prisma 7 datasource configuration so CLI migrations use the direct database URL while app runtime can use the pooled URL.
- Wired NextAuth with the Prisma adapter, Google OAuth provider, database sessions, App Router auth route, and reusable `requireUser()` helper.
- Added a minimal Google sign-in page, sign-out control, and protected auth-check route for validating the authentication foundation.
- Replaced the temporary auth-check route with a protected app shell, Dashboard and Jobs placeholders, and minimal UI primitives for the next product workflows.
- Added manual job creation with a protected `/jobs/new` route, Zod validation, and a server action that saves jobs for the authenticated user.
- Tightened job creation validation so company and title values must include at least one letter.
- Added the authenticated `/jobs` list with newest-first ordering, status badges, core job metadata, and an empty state.
- Added authenticated job detail pages with scoped single-job queries and full saved posting metadata.
- Added job status updates from the detail page, scoped to the authenticated user.
- Added job editing with a prefilled edit page, shared create/edit field rendering, shared field validation, and scoped update action.
- Added archive and permanent delete management from the job detail page.
- Split the jobs list into active and archived views using `/jobs` and `/jobs?status=archived`.
- Added timestamped job notes with scoped creation, listing, and deletion on the job detail page.
- Replaced the dashboard placeholder with scoped summaries for active jobs, status counts, recent jobs, and upcoming dates.
- Completed a focused MVP polish pass across navigation, empty states, status badges, forms, and responsive spacing.
- Refined the dashboard into a compact pipeline summary and condensed the job detail layout for faster scanning.
- Improved status update UX so changing the status select auto-saves with pending and error feedback.
- Completed a final portfolio/readiness pass with an accurate reviewer-facing README, deployment notes, screenshot placeholders, and small accessibility improvements for navigation and action feedback.
- Polished the `/sign-in` page into a more portfolio-ready entry screen with stronger product messaging and a more intentional sign-in panel.
- Tightened the sign-in page copy so the right panel focuses on getting started and the left side carries the product benefits.
- Added global cursor rules so normal text uses the default cursor while links, buttons, selects, and form inputs keep the expected interactive cursors.
- Made the NextAuth config fail clearly when Google OAuth env vars are missing and set the auth secret explicitly in the NextAuth v4 options.
- Clarified the README deployment notes for `NEXTAUTH_SECRET` and `NEXTAUTH_URL`.
- Added explicit dashboard summary types so Vercel/TypeScript builds do not degrade mapped job items to implicit `any`.
- Replaced a Prisma namespace type import that was incompatible in the deployment environment with explicit dashboard payload types.
- Added explicit typing for dashboard `groupBy` status results so status counts remain strictly keyed by `ApplicationStatus` in deployment builds.
- Moved dashboard status typing to an app-level `ApplicationStatus` union in `features/jobs/status.ts` to avoid deployment failures from Prisma enum type exports.
- Isolated dashboard `groupBy` typing from mixed `Promise.all` inference so `group.status` stays typed as `ApplicationStatus` when indexing status counts.
- Hardened deployment configuration by requiring `DATABASE_URL` and `NEXTAUTH_SECRET` at runtime, adding a Node 22 engine target, and generating Prisma Client during install.
- Replaced the broad dashboard status-group cast with an app-level status guard and typed mapper.
- Added a public homepage at `/` with a clear sign-in CTA, feature overview, and explicit separation between implemented tracker features and planned AI features.
- Reworked authenticated mobile navigation to use a hamburger-triggered menu instead of wrapped sidebar links, with nested Archived under Jobs and corrected mobile active states.
- Implemented manual AI job description analysis with OpenAI, Zod validation/normalization, `JobAnalysis` upserts, and job detail rendering.
- Tightened AI analysis prompt instructions to improve category separation for required skills vs preferred skills vs responsibilities, preserve either/or requirements, and infer seniority conservatively from explicit years.
- Added production-only AI usage protection with a database-backed daily per-user analysis limit and a pre-provider job description length guard.
- Polished the job analysis card UX with clear usage-limit messaging, pre-submit over-length warnings, and a stronger in-progress state while AI analysis runs.
- Updated the roadmap to mark the MVP as complete and deployed, then defined the next post-MVP phases for AI refinement, profile-based matching, importing, testing, and portfolio polish.
- Polished AI analysis quality and resilience with tighter extraction constraints, clearer provider error mapping, improved long-result readability, and optional usage metadata capture per analysis run.
- Improved AI analysis failure UX by classifying timeout, rate-limit, and provider failures with explicit user-facing messages, plus structured server-side provider error logging.
- Hardened AI failure classification by handling OpenAI SDK error classes directly (`APIConnectionTimeoutError`, `RateLimitError`, connection/server errors) so retry messages are more accurate in production.
- Split AI failure handling into provider-call errors and analysis-save errors so non-provider failures no longer appear as generic OpenAI issues, and retry guidance is now conditional by error retriability.
- Added a save-path compatibility fallback: if Prisma rejects optional usage metadata fields (`model`/token columns), analysis is retried and saved without metadata instead of failing the whole user flow.
- Re-enabled optional AI usage metadata persistence on `JobAnalysisRun` now that schema and database alignment are confirmed (`model`, `inputTokens`, `outputTokens`, `totalTokens`).
- Added runtime capability detection for `JobAnalysisRun` usage metadata fields so analysis saves do not fail if the active Prisma client process is temporarily out of sync with the latest schema generation.

### Notes
- The MVP will focus on a polished job application tracker before adding AI features.
- AI features will be layered in after the core tracker, auth, database, and notes workflows are stable.
- The initial migration establishes the auth-adjacent tables, job tracking tables, notes, job analysis placeholder, enums, indexes, and cascade relationships.
- Authentication now has the server-side foundation needed for future protected routes and user-owned data checks, but custom auth UI is still intentionally deferred.
- The authenticated route-group layout is now the main auth boundary for future app pages.
- Job ownership is enforced server-side by deriving `userId` from `requireUser()`, not from submitted form data.
- Company and title validation now rejects numeric-only or punctuation-only input while still allowing realistic names with numbers.
- The jobs list uses a server-side query scoped to the authenticated user's id.
- Job detail access uses the same ownership boundary, returning not found for missing or unauthorized jobs.
- Status updates use server-side validation and scoped writes, and first set `appliedAt` when a job moves to `APPLIED`.
- Edit updates reuse the core job field validation and write through `id` plus authenticated `userId`.
- Archive keeps the job and changes status to `ARCHIVED`; delete removes the job and relies on Prisma cascade relations for related records.
- Archived jobs are hidden from the default active list but remain accessible through the archived query-param view.
- Notes are scoped by both authenticated user and parent job ownership.
- Dashboard summaries exclude archived jobs from active totals, recent jobs, and upcoming reminders while still showing an archived count.
- Shared status metadata keeps labels and badge styling consistent across dashboard, list, detail, and forms.
- The job detail page now prioritizes summary metadata, status, dates, description, notes, and management actions in a denser responsive layout.
- The README now clearly separates implemented tracker features from planned AI and resume features, and includes local setup plus production Google OAuth callback guidance.
- The sign-in page now reads more like a polished SaaS entry point while keeping Google authentication behavior unchanged.
- The sign-in page is now cleaner for screenshots and new-user onboarding without changing auth behavior.
- Cursor behavior now matches the intended interaction model across the app shell, auth page, and form controls.
- Auth startup errors should now be clearer if Google OAuth variables are missing, instead of falling through to empty-string credentials.
- Dashboard summary data now has an explicit typed contract for recent and upcoming jobs, which keeps page rendering strictly typed across environments.
- Dashboard query typing no longer depends on `Prisma` namespace exports, avoiding environment-specific type import failures.
- Dashboard status aggregation no longer allows `group.status` to degrade to `any` when indexing status count records.
- Status label/badge metadata and dashboard aggregation now share the same app-level status union type.
- Dashboard status count aggregation now uses explicit query-boundary typing plus an explicit `Record<ApplicationStatus, number>` accumulator.
- Deployment setup should now fail faster and more clearly when critical auth or database env vars are missing, instead of falling through to opaque runtime/build errors.
- The root route now gives signed-out visitors a clear entry point and sends signed-in users straight to the dashboard.
- Mobile app-shell navigation now avoids layout wrapping and keeps page content stable while exposing Dashboard, Jobs, Archived, Add Job, and Sign out in a compact menu.
- AI analysis is now an explicit user-triggered workflow on the job detail page and stores validated structured output instead of raw model text.
- Prompt quality now better emphasizes concrete required qualifications, avoids vague trait leakage into required skills, and routes company-only terms toward keywords.
- OpenAI is now skipped entirely when a description is too long or the authenticated user has reached the daily production analysis limit.
- The analysis UI now explains the character and daily production limits before submission and shows explicit progress feedback during analysis.
- The roadmap now reflects the shipped MVP instead of the original pre-launch phase plan.
- AI analysis now handles rate-limit and provider-unavailable failures with clearer user-facing responses and records optional model/token metadata for future cost and quality tuning.
- Failure states now provide clearer retry guidance in the UI while preserving existing pending and ownership-protected server action flow.
- Re-analyze errors now prioritize specific failure messages over generic fallback text and include safer action-level error diagnostics for operations triage.
- Logging now captures provider request IDs when available, plus separate diagnostics for provider classification failures versus database save failures.
- Save-failure logs now explicitly distinguish metadata schema/client mismatch from genuine persistence failures.
- Usage runs now store both ownership (`userId`, `jobId`) and optional model/token metadata when returned by OpenAI.
- Metadata writes are now conditional on the generated client's runtime data model, which preserves reliability while still capturing usage fields when supported.

### Next Step
- Validate the app one more time with lint/build, then capture screenshots or deploy a demo when ready.
