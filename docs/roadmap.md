# Roadmap

Track My Apps now has a complete, deployed MVP. The remaining roadmap shifts from core tracker delivery to AI refinement, profile-based matching, importing, and later product polish.

## Status Summary

- Core MVP is complete and deployed.
- The first AI feature, job description analysis, is implemented.
- Resume/profile matching, interview prep, and job importing are still planned.
- Automated tests, advanced filtering, and broader accessibility polish remain useful future improvements.

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
- A broader automated test suite remains a useful future improvement.

### Phase 14: Portfolio Finish

- Completed.
- Updated README content, deployment notes, and screenshots.
- Added portfolio-ready presentation and reviewer-friendly documentation.

## Remaining MVP-Adjacent Improvements

- Add automated tests if the project grows enough to justify them.
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

- Add user profile and resume text storage.
- Store skills, projects, and experience in a user-owned profile model.
- Keep ownership and privacy boundaries explicit.
- Do not add AI matching until profile data exists.

### Phase 18: Resume-to-Job Matching

- Compare saved profile data against job analysis.
- Add fit scores, matching skills, and missing skills.
- Suggest keywords and resume bullets without fabricating experience.

### Phase 19: Interview Prep

- Generate job-specific technical questions.
- Generate behavioral questions and STAR prompts.
- Surface study topics tied to the role.

### Phase 20: Job URL Importing

- Allow pasting a job URL to prefill job details.
- Keep a manual review and edit step before saving.
- Consider future `JobPosting` and `UserSavedJob` normalization if the feature expands.
- Keep scraping scope narrow until product requirements are clearer.

### Phase 21: Search, Filtering, and Organization

- Add search by company and title.
- Add filtering by status, deadline, remote type, and employment type.
- Add sorting by newest, deadline, and follow-up.
- Improve active and archived organization if the list grows further.

## Phase 22: Import / Export

- Export saved jobs to CSV.
- Import existing CSV/XLSX job trackers.
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

### Phase 24: Portfolio/Resume Polish

- Update README screenshots when the AI UI is stable.
- Refresh resume wording from AI-ready to AI-powered job description analysis.
- Keep planned features clearly marked as planned.

