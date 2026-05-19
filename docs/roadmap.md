# Roadmap

Track My Apps now has a complete, deployed MVP with several post-MVP slices already shipped. The remaining roadmap shifts from tracker organization to AI refinement, guidance, tailoring, analytics, importing, and later product polish.

## Status Summary

- Core MVP is complete and deployed.
- AI job analysis, AI profile extraction, transient profile-to-job matching, interview prep, and jobs search/filter/sort are implemented.
- Application Pipeline, dark mode, CSV export/import, and recent QA/security hardening are implemented.
- Implemented AI features remain transient where appropriate and stay grounded in saved user data.
- Remaining roadmap items focus on guidance, tailoring, analytics, importing polish, and broader reliability work.

## Completed MVP Phases

### Phase 1: Project Setup

- Completed.
- Set up the Next.js app with TypeScript, Tailwind CSS, ESLint, Prisma, PostgreSQL, NextAuth, and Zod.
- Configured environment variables and the initial Prisma schema.

### Phase 2: Design Foundation

- Completed.
- Defined the authenticated app shell.
- Added dashboard navigation and reusable UI primitives.
- Established loading, empty, and error states early.

### Phase 3: Authentication

- Completed.
- Added Google OAuth sign-in and sign-out.
- Added protected app routes and `requireUser()`.
- Confirmed user-owned data is checked server-side.

### Phase 4: Database Models

- Completed.
- Added auth models plus `Job`, `Note`, `JobAnalysis`, and supporting enums.
- Ran the initial product migration.

### Phase 5: Job Creation

- Completed.
- Built `/jobs/new`.
- Added Zod validation and a create-job server action.
- Redirects to the new job detail page after creation.

### Phase 6: Job List

- Completed.
- Built `/jobs`.
- Added status filtering, newest-first ordering, and empty states.
- Added archived job access through `/jobs?status=archived`.

### Phase 7: Dashboard

- Completed.
- Built `/dashboard`.
- Added status counts, recent jobs, and upcoming dates.

### Phase 8: Job Detail

- Completed.
- Built `/jobs/[jobId]`.
- Added metadata, full descriptions, status updates, and key dates.

### Phase 9: Notes

- Completed.
- Added note creation, listing, and deletion on the job detail page.

### Phase 10: Edit Job

- Completed.
- Built `/jobs/[jobId]/edit`.
- Reused the job form and update action where it improved clarity.

### Phase 11: Basic Analysis Placeholder

- Completed and superseded.
- The placeholder has been replaced by real structured AI analysis storage and display.

### Phase 12: Polish Pass

- Completed.
- Improved responsive layout, loading states, form errors, and pending UI.
- Tightened naming, boundaries, and empty states.

### Phase 13: Testing

- Partially complete.
- Lint and build checks are in place.
- Focused Vitest coverage is in place for core schemas and helper logic.
- Broader automated coverage remains a useful future improvement.

### Phase 14: Portfolio Finish

- Completed.
- Updated README content, deployment notes, and screenshots.
- Added portfolio-ready presentation and reviewer-friendly documentation.

## Remaining MVP-Adjacent Improvements

- Expand automated tests if the project grows enough to justify broader coverage.
- Add title/company search if it becomes useful beyond the current list views.
- Add advanced filtering and sorting only if the tracker workflow starts to feel crowded.
- Continue accessibility polish over time as specific issues surface.

## Post-MVP Roadmap

### Phase 15: AI Job Description Analysis

- Implemented.
- Structured AI analysis extracts summaries, required skills, preferred skills, responsibilities, keywords, and seniority signals.
- Results are stored in `JobAnalysis` with validation and normalization.
- Usage protections limit input length and production usage.

### Phase 16: AI Analysis Polish

- Improve prompts based on real job descriptions.
- Improve UI for long analysis results and dense postings.
- Track model and cost metadata later if needed.
- Add stale-analysis detection if the job description changes.

### Phase 17: Resume/Profile Foundation

- Implemented.
- Added a private canonical user profile page with resume text, skills, structured target titles, structured experience ranges, multi-select work preferences, and career links.
- Added AI-assisted profile extraction suggestions from saved resume text with manual review/apply before profile save.
- User profile and resume text storage are now in place behind authenticated ownership checks.
- Skills, experience, and preferences are stored in a user-owned profile model.
- Ownership and privacy boundaries remain explicit.

### Phase 18: Resume-to-Job Matching

- Implemented as a transient manual comparison on the job detail page.
- Current reports use fit levels, matching evidence, missing areas, prep topics, and safe resume guidance without fabricating experience.
- Future improvements can refine report quality, invalidation rules, and optional saved history only if the transient workflow proves worth keeping.

### Phase 19: Interview Prep

- Implemented as a transient AI feature inside job detail `AI Insights`.
- Requires saved `JobAnalysis` before generation.
- Allows optional `UserProfile` personalization without blocking general job-based prep.
- Generates technical questions, behavioral / STAR prompts, topics to review, weak areas, role-specific talking points, and questions to ask the interviewer.
- Reuses prompt-injection hardening and Zod validation/normalization.
- Does not persist results to Prisma yet.
- Uses the existing temporary AI usage protection shared with profile matching in the current MVP.
- Ships with a summary-first UI and show more/show less behavior for long question lists.
- Future improvements: dedicated usage tracking, optional saved history, mock interview mode, and marking questions as practiced.

### Phase 20: Job URL Importing

- Allow pasting a job URL to prefill job details.
- Keep a manual review and edit step before saving.
- Keep this narrow and manual-review focused because scraping can become unreliable.
- Consider future `JobPosting` and `UserSavedJob` normalization if the feature expands.

### Phase 21: Search, Filtering, and Organization

- Implemented.
- Search by company and title on `/jobs`.
- URL-preserved multi-select filters for statuses, remote types, and employment types.
- URL-preserved sorting for newest, deadline soonest, and follow-up soonest.
- Clear-filters action, active filter chips, and filtered empty-state messaging.
- Active and archived views remain intact and work with the new controls.
- Remaining follow-up:
- Add richer deadline-specific filter controls if needed.
- Expand organization/filter depth only when list size and usage patterns justify it.

## Phase 22: Import / Export

- CSV export for saved jobs is implemented.
- Formatted XLSX export for saved jobs is implemented.
- CSV import for saved jobs with preview, mapping, validation, and explicit confirm is implemented.
- Future work remains:
- Keep CSV export for compatibility with existing workflows.
- Make exports authenticated and user-scoped, without including profile/resume data or transient AI match reports.
- Extend import support to XLSX job trackers.
- Add column mapping for spreadsheet imports.
- Validate imported rows before saving.
- Show a preview and skipped-row report.
- Keep all imported jobs scoped to the authenticated user.

### Phase 23: Testing and Reliability

- Add tests for Zod schemas.
- Add tests for server actions where practical.
- Verify auth and ownership boundaries.
- Test AI usage limits.
- Add production monitoring considerations.
- Recent security hardening already completed:
- App-wide security headers.
- Prompt-injection hardening across AI flows.
- Auth endpoint rate limiting.
- Focused UI bug fixes from QA passes.

### Phase 24: Portfolio/Resume Polish

- Update README screenshots when the AI UI is stable.
- Refresh resume wording from AI-ready to AI-powered job description analysis.
- Keep planned features clearly marked as planned.

### Phase 25: Job Search Guidance Layer

- Today action queue.
- Follow-up command center.
- Overdue follow-up detection.
- Application priority signals.
- Stale AI output detection when job descriptions or profile data change.
- Dashboard guidance that tells users what to do next.

### Phase 26: Resume Tailoring and Prep Workspace

- Resume tailoring checklist based on job analysis and profile.
- Safe, evidence-based suggestions without fabricating experience.
- Option to save interview prep reports.
- STAR story bank.
- Mark interview questions as practiced.

### Phase 27: Job Search Analytics

- Response rate by role type or source.
- Interview rate by source or status history.
- No-response aging.
- Best-fit roles by profile match.
- Weekly job search review.
