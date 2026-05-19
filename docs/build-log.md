# Build Log

This log tracks meaningful project progress by date.

It should document what changed, why it mattered, and what the next step is. It is not meant to list every tiny code edit.

---

## 2026-05-19

### Changes
- Added formatted XLSX export for saved jobs with a new authenticated route at `/jobs/export/xlsx`.
- Kept export user-scoped by reusing existing server-side ownership enforcement and job query boundaries, without changing Prisma schema or auth logic.
- Updated export query behavior to follow current `/jobs` URL-applied filters and sorting (`status/view`, `q`, `statuses`, `remoteTypes`, `employmentTypes`, `sort`) for XLSX export.
- Added spreadsheet formatting for readability: bold header row, frozen header row, autofilter, tuned column widths, wrapped long text columns, and explicit date column formatting.
- Added spreadsheet formula-injection protection for user-controlled text cells by escaping values that start with `=`, `+`, `-`, or `@`.
- Added an `Export XLSX` control beside `Export CSV` on `/jobs` and matched the existing disabled/empty-state behavior when no rows are exportable.
- Added focused tests for XLSX row mapping and formula-sanitization behavior.
- Updated `docs/roadmap.md` Phase 22 to mark formatted XLSX export as implemented.
- Fixed two `/jobs` filter-toolbar UX regressions: closing the secondary filter panel no longer drops draft multi-select filter values on apply, and active filter chips now support one-click per-chip removal.
- Decoupled panel visibility from applied filter state by keeping expand/collapse as local UI-only state and applying filters from controlled draft state instead of relying on conditionally mounted checkbox form inputs.
- Added accessible chip remove controls (`aria-label` per chip) for status, remote type, and employment type filters that update local draft state and URL-applied filters in one action while preserving active/archived baseline behavior.
- Redesigned the `/profile` form into clearer section cards (`Profile Overview`, `Resume & AI Extraction`, `Skills & Experience`, `Career Links`) to reduce long-form fatigue while keeping all fields editable.
- Expanded predefined profile target-role options well beyond software engineering and added broader title normalization aliases so role targeting better fits multi-discipline job seekers without schema or behavior changes.
- Improved profile dark-mode polish by fixing the sticky unsaved-changes bar to use dark surface, dark border, readable text, and app-consistent shadow treatment instead of a bright disconnected floating strip.
- Added resume upload/import text support in the profile workflow so users can extract plain text from `.txt`, `.docx`, or `.pdf` files without manual copy/paste.
- Kept resume import authenticated and transient (no file storage), added server-side file validation (type/extension + size cap), and surfaced extraction errors with explicit user guidance.
- Kept extracted text review-first by showing preview output and requiring an explicit "Use extracted text in form" action before any draft replacement, with normal profile save still required to persist.
- Hardened resume import failure handling so unsupported/incompatible uploads now fail safely with inline messages and do not crash the profile page or break later profile saves.
- Changed resume import UX to suggestions-first: upload now extracts text and immediately runs profile suggestion extraction, showing structured suggestions as the primary output with explicit apply/save steps.
- Reframed raw resume text as secondary source context via collapsible UI, preserving manual editing and saved resume context for downstream matching/prep workflows.
- Redesigned `/profile` into a clearer workspace layout with a profile summary header, canonical profile editor area, and dedicated tools rail for resume import, AI extraction, and completion status.
- Added lightweight profile completeness tracking and visual progress indicators to surface missing core profile signals without altering save semantics.
- Added skills chip previews alongside textarea editing to improve readability while preserving manual structured input control.
- Added a `/jobs` Cards/Table view toggle with URL persistence (`layout=table`) so users can switch between the existing card workflow and a compact high-density table scan mode.
- Kept search/filter/sort, active/archived tabs, auth-scoped query behavior, and CSV/XLSX export behavior unchanged while preserving selected layout across jobs query interactions.
- Implemented a semantic jobs table view with status badges, key tracking columns, responsive horizontal overflow on smaller screens, and keyboard-accessible row actions.
- Refined profile workspace desktop layout to use a wider content container and stronger two-column proportion so the page no longer feels cramped.
- Reduced visual clutter by removing unnecessary outer card wrappers and simplifying nested bordered containers in the profile editor/tools areas.
- Kept all profile logic and save/discard behavior intact while improving hierarchy with larger workspace header treatment, cleaner section grouping, and preserved dark-mode styling.
- Ran a copy-density and hierarchy cleanup across Profile, Dashboard, and Jobs to remove repeated eyebrow labels and redundant explanatory text while keeping core UX guidance and validation messages.
- Simplified profile page headings/subheadings and tool-card copy so the workspace feels less tutorial-like and more task-focused without changing profile logic.
- Kept the existing Application Pipeline SVG visualization intact and removed duplicate surrounding snapshot labels/descriptions to reduce dashboard text clutter.

### Notes
- CSV export behavior remains unchanged.
- XLSX export does not include profile/resume data or transient AI match/interview prep reports.

### Next Step
- Add XLSX import support with mapping/preview parity once the current CSV import workflow is stable enough to extend.

## 2026-05-18

### Changes
- Strengthened `AGENTS.md` with new UI/state, URL-state, and React event-handling guardrails after the recent `/jobs` filter-toolbar issues.
- Added explicit guidance to keep trigger controls stable, separate draft vs applied filter state, reset visible UI on clear actions, and capture event values before state updates.
- Refreshed `docs/roadmap.md` to reflect the current implemented state after Interview Prep, multi-select jobs filtering, and other post-MVP shipped work.
- Marked Phase 19 and Phase 21 as implemented, kept import/export and testing/reliability future work, and added new future phases for guidance, tailoring, and analytics.
- Clarified the product direction to stay focused on what happens after a user finds a job rather than turning Track My Apps into a job board.
- Improved `/jobs` Clear Filters UX so it now behaves as a form reset in the expanded multi-select panel: draft checkbox selections clear immediately, panel stays open, and URL filters are cleared only when applied filters exist.
- Added draft-vs-applied filter awareness in the client toolbar so `Clear filters` is available for unapplied checkbox selections as well as applied URL filters.
- Fixed a `/jobs` filter-state sync bug where `Clear filters` removed URL params but checkbox selections stayed visually checked in the expanded panel.
- Ensured toolbar filter UI now re-syncs to URL-derived state after navigation by remounting the filter toolbar on search-param changes, so cleared params immediately produce unchecked checkboxes and removed chips.
- Upgraded `/jobs` secondary filters from single-select dropdowns to multi-select checkbox groups for statuses, remote types, and employment types.
- Added URL-preserved multi-value filter params (`statuses`, `remoteTypes`, `employmentTypes`) while preserving archived-tab behavior with `status=archived`.
- Updated server-side job query filtering to apply multi-value `in` conditions for status/remote/employment filters under authenticated user scoping.
- Kept search/sort/toggle behavior intact and preserved active filter chips plus clear-filters behavior for multi-select state.
- Added parsing/serialization test coverage updates for the multi-value filter param migration with backward compatibility for legacy single-value params.
- Fixed `/jobs` filter-toggle behavior so `Filters` now reliably expands/collapses secondary controls with a dedicated client-side toggle state, while preserving server-rendered query behavior.
- Kept the top toolbar row stable (`Search | Sort | Filters | Apply`) and moved secondary filters into a true conditional panel underneath, removing the prior confusing always-visible state.
- Refined the `/jobs` compact filter toolbar to keep the top control row stable when filters expand, so `Search | Sort | Filters | Apply` remains aligned without jumpy button reflow.
- Moved expanded secondary filters into a dedicated second row/panel under the primary toolbar, preserving existing filter/query behavior while reducing layout shift.
- Polished `/jobs` filter controls into a compact toolbar layout so search and sort stay visible while secondary filters move behind an expandable `Filters` section.
- Added active-filter chips and contextual `Clear filters` visibility to reduce vertical space while keeping current query behavior transparent.
- Preserved existing URL query behavior, active/archived view semantics, and empty-state logic while improving mobile and dark-mode readability.
- Implemented the next practical jobs-list workflow upgrade on `/jobs`: search by company/title, status/remote/employment filters, and sort options for newest, deadline soonest, and follow-up soonest.
- Kept all filtering user-scoped at the Prisma query boundary and preserved active vs archived behavior while adding URL-stable query params for search/filter/sort state.
- Added a compact, mobile-friendly filter bar with apply and clear actions, plus filtered empty states that distinguish "no jobs yet" from "no matching jobs."
- Added focused tests for jobs list query-param normalization and query-string serialization helpers to keep URL behavior predictable.
- Updated `docs/roadmap.md` to mark Phase 21 as meaningfully advanced with the implemented MVP search/filter/sort slice.
- Updated `docs/roadmap.md` to mark Phase 19: Interview Prep as implemented and to describe the current transient MVP behavior, prerequisites, and follow-up ideas.

### Notes
- This was a documentation-only update. No application code changed.

### Next Step
- Keep the roadmap aligned with future AI product slices as they move from planned to implemented.

### Changes
- Added a new transient `Interview Prep` workflow to job detail `AI Insights`, alongside `Job Analysis` and `Profile Match`, with a third tab and compact summary-first UI.
- Introduced `src/features/interview-prep/` with feature-local schemas, OpenAI service, server action, and UI component to keep boundaries consistent with existing AI modules.
- Enforced prerequisites so interview prep requires a saved `JobAnalysis` but allows generation without a `UserProfile`, with explicit UX messaging that a profile improves personalization.
- Reused existing AI hardening patterns end-to-end: untrusted content tagging, prompt-injection defense lines, and structured output safety checks before rendering.
- Kept interview prep transient (no Prisma persistence of the generated report) and avoided schema/env changes as planned.
- Added focused tests for interview-prep schema normalization and hardening-guard behavior checks.
- Reused existing production usage-limit infrastructure by sharing the current profile-match daily cap for interview prep in this MVP iteration.
- Redesigned Interview Prep result presentation for readability and scanability: moved to summary-first structure, surfaced limitation notes near the top, introduced a focus-areas grid, and converted question lists into lightweight prompt sections with ordered lists.
- Added per-section `Show more` / `Show less` behavior for longer prompt lists so each section defaults to a compact first slice instead of rendering full-length walls of text.
- Improved Interview Prep dark-mode/mobile legibility with explicit dark-surface/text variants, reduced nested border density, and softer spacing.

### Notes
- Usage-limit sharing is intentionally temporary: it provides immediate abuse protection without a schema migration, but does mix semantics between matching and interview prep.
- No auth ownership boundaries, existing job-analysis behavior, or existing profile-match behavior were changed.

### Next Step
- If interview prep usage justifies separate tuning/analytics, add a dedicated `InterviewPrepRun` tracking model and independent daily cap in a follow-up migration.

## 2026-05-15

### Changes
- Added focused auth-route rate limiting at the network boundary using Next.js `proxy.ts`, scoped only to `/api/auth/:path*` and `/sign-in` so dashboard and app routes remain unaffected.
- Introduced a shared auth rate-limit helper with route-specific policies: stricter general auth limits, more forgiving limits for OAuth callbacks and session reads, and a mild public-page limit for `/sign-in`.
- Wired the limiter to use Upstash Redis over REST when `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (or Vercel-injected `KV_REST_API_URL` / `KV_REST_API_TOKEN`) are available, with a documented in-memory fallback for local or misconfigured environments.
- Added generic `429` handling with retry headers and without exposing sensitive auth, callback, or provider details.
- Added focused unit coverage for auth rate-limit policy selection, forwarded-IP extraction, and in-memory fallback behavior.
- Ran a focused prompt-injection hardening pass across all three OpenAI-backed workflows: saved job description analysis, saved resume-to-profile extraction, and saved profile-to-job matching.
- Added a shared AI hardening helper in `src/lib/ai-hardening.ts` so prompt-defense rules and output checks stay consistent instead of drifting across feature-local service files.
- Updated each OpenAI service prompt to explicitly treat job descriptions, resume text, saved job analysis data, and saved profile fields as untrusted content, with clear tagged boundaries and direct instructions to ignore attempts to override the task, force fit levels, reveal prompts, change schemas, or bypass safety rules.
- Preserved the existing structured response schemas and normalization paths while adding a deterministic post-parse guard that rejects obvious prompt-injection phrases if they appear in model output.
- Added focused unit coverage for the new hardening helper and revalidated the project with `npm run test`, `npm run lint`, and `npm run build`.

### Notes
- This auth hardening does not replace stronger perimeter controls such as Vercel WAF or bot protection; it is a focused application-level rate limit for auth-related routes.
- The fallback in-memory limiter is intentionally small and maintainable, but it is only best-effort protection when Redis is not configured because serverless instances do not share memory.
- This is defense-in-depth hardening, not a claim that prompt injection is solved.
- Product behavior remains the same: job analysis still saves automatically after a successful validated run, profile extraction still requires user review/apply before save, and job-match reports remain transient.
- No Prisma schema or ownership/auth logic changed. Deployment configuration now optionally includes Redis credentials for production-safe auth rate limiting.

### Next Step
- In the deployed environment, provision Upstash Redis if it is not already present, then run a short manual smoke pass covering Google sign-in, sign-out, callback flow, and repeated `/api/auth` requests to confirm the intended `429` thresholds.

## 2026-05-12

### Changes
- Ran a focused QA bug-fix pass on the existing app without changing product scope, Prisma schema, or AI behavior.
- Added app-wide HTTP security headers through `next.config.ts`: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and a conservative starter `Content-Security-Policy`.
- Kept the CSP intentionally compatible with the current Next.js App Router setup and Google OAuth sign-in flow by allowing same-origin app resources plus the minimum Google API/connect origins used by auth.
- Fixed the jobs-page CSV export affordance so `Export CSV` is visibly disabled when the current filtered view has no jobs, with disabled semantics and clearer user guidance.
- Added a lightweight first-time profile guidance block above the existing profile form so new users get an obvious starting affordance without blocking manual entry.
- Strengthened shared button and link-button hover/focus treatment so primary actions have clearer interaction feedback while staying consistent with current light/dark styling.
- Improved the dashboard pipeline `Chart / Cards` segmented control so the selected state stays visually distinct even when there are zero tracked jobs and both views lead to the same empty-state content.

### Notes
- This was a hardening/polish pass only. No new features, schema changes, auth flow redesigns, or AI prompt/behavior changes were introduced.
- The CSP remains conservative rather than maximally strict because breaking Next.js runtime scripts, inline styles, or Google OAuth would be a worse production outcome than starting with a slightly broader allowlist and tightening later with route-aware nonces or hashes.

### Next Step
- Re-run a short manual auth + dashboard smoke test in the deployed environment after release so the production headers are validated with the real OAuth callback domain.

## 2026-05-10

### Changes
- Refined sidebar information architecture so `Archived` is no longer treated as a top-level destination and now lives under `Jobs` as a nested view.
- Added explicit nested jobs sub-navigation in both desktop and mobile menus: `Active` (`/jobs`) and `Archived` (`/jobs?status=archived`).
- Kept `Dashboard`, `Jobs`, and `Profile` as top-level sidebar items while preserving existing dark-mode styling, spacing, and interaction patterns.
- Updated active-state behavior so jobs context remains clearly active on any jobs route, while the correct nested view is highlighted for active vs archived list state.
- Restored `Jobs` parent clickability in desktop and mobile navigation so the top-level `Jobs` item navigates to `/jobs` while preserving nested `Active`/`Archived` links.
- Added a new dashboard `Application Pipeline` visualization that uses existing authenticated job status counts to show the current funnel across `Saved`, `Applied`, `Interviewing`, `Offer`, `Rejected`, and `Archived`.
- Implemented the pipeline as a custom responsive dashboard component instead of adding a charting dependency, with a horizontal connected flow on desktop and a simplified stacked version on mobile.
- Enhanced the dashboard pipeline card with an original SVG-backed chart layer so desktop now reads more like a real flow visualization, using weighted curved bands for the primary path and distinct secondary lanes for `Rejected` and `Archived`.
- Refined the pipeline chart alignment so desktop flow bands connect cleanly to their intended stage nodes, and reduced always-visible explanatory copy by moving the chart caveat into a compact accessible info tooltip.
- Rebuilt the desktop pipeline visualization into a single SVG coordinate system after the mixed SVG + absolutely positioned HTML overlay proved too brittle at common desktop widths and caused clipping/alignment failures.
- Retuned the desktop SVG aspect ratio and node spacing so the pipeline uses more horizontal card space at wider desktop resolutions without increasing the card height.
- Increased the desktop pipeline chart height and expanded the vertical SVG spacing so the main flow and side paths have more breathing room without changing the mobile layout or reverting the wider desktop fit.
- Added extra bottom breathing room to the desktop SVG canvas so the `Rejected`/`Archived` side-path lane no longer sits against the lower chart edge, while leaving the main pipeline coordinates unchanged.
- Fine-tuned only the lower desktop lane geometry (`Side paths`, `Rejected`, `Archived`, and the lane guide line) to increase visible bottom padding and reduce the squeezed feel without changing the main top pipeline spacing.
- Reworked the desktop pipeline chart into a clearer two-lane composition by materially increasing the rendered SVG height and internal canvas height, keeping the main status flow in the upper half and moving the side-path lane deeper into the lower half.
- Standardized the desktop side-path node sizing so `Rejected` and `Archived` now use the same card height and internal spacing rhythm as the main pipeline nodes, with dashed styling carrying the distinction instead of smaller card geometry.
- De-emphasized `Archived` in the desktop pipeline by removing its large connector band and relying on muted/dashed node styling, while also spreading the SVG node layout closer to the chart-frame edges so the visualization reads as intentionally full-width.
- Cleaned up the desktop pipeline framing by removing redundant inner borders, softening the chart container into a background layer, and pushing the SVG content closer to the frame edges so the visualization feels more integrated into the main dashboard card.
- Repositioned `Rejected` under `Applied` for a clearer lower-lane balance, removed the hard horizontal separator between the main and side-path lanes, and kept `Archived` as a muted unconnected end-status card.
- Corrected the desktop lower-lane semantics by reconnecting `Rejected` from `Saved` and removed the in-chart `Side paths` label/pill so the chart reads cleaner while preserving the same overall styling and layout.
- Added a persisted `Chart / Cards` view toggle to the `Application Pipeline` card so users can switch between the SVG pipeline visualization and a compact status-cards breakdown without changing dashboard data or status logic.
- Changed theme fallback behavior so users with no saved preference now default to dark mode (SSR + client), while existing saved light/dark preferences continue to persist across sessions.

### Notes
- This was a navigation-UX and hierarchy improvement only; routes, query semantics, filtering logic, auth, database, and AI behavior were unchanged.
- `Import jobs` remains an in-page action from the Jobs screen rather than a sidebar destination to keep primary navigation focused on persistent views.
- The pipeline visualization is a snapshot of current status distribution, not a historical conversion chart, and it reuses the existing dashboard summary query without schema changes.
- The chart weights are visual emphasis only, derived from current status counts; the app still does not store status history or true conversion transitions.
- The current desktop chart now scales as one unit, so flow bands, labels, and stage nodes stay aligned together instead of drifting independently as the dashboard card resizes.
- The pipeline view preference now saves to `localStorage` (`application-pipeline-view`) and hydrates on the client with a stable default (`Chart`) to avoid server/client mismatch.
- Removed the old `system` theme fallback path to eliminate OS-driven defaults and keep first paint deterministic, preventing light-theme flashes before dark mode is applied.

### Next Step
- Retake the dashboard screenshot so the public README reflects the new pipeline card and current visual polish.

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
- Ran a focused SaaS-style visual polish pass across the authenticated shell and key dashboard/job pages: upgraded card surfaces, strengthened shell branding/hierarchy, improved active nav treatment, restored `Profile` visibility in primary sidebar navigation, and refined dashboard pipeline widgets for screenshot readiness.
- Added app-wide light/dark mode support with a client-side theme toggle in the app-shell header and mobile menu, persisted theme preference (`localStorage`), pre-hydration theme bootstrap to avoid flash/mismatch, and dark-surface/readability updates across shared UI primitives and key authenticated screens.
- Fixed dark-mode toggle state drift and refresh flash by unifying theme semantics (`theme` key with `light`/`dark`), switching initial theme application to server-side cookie-backed `<html>` class/data attributes, and adding a polished icon-only toggle with synced aria/title labels.
- Fixed a React/Next hydration mismatch in the theme toggle by removing render-time `window`/`document` branching, passing server-derived initial theme preference into the app shell, and using a hydration-safe external-store toggle state that stays in sync with cookie/localStorage/DOM theme attributes.
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
