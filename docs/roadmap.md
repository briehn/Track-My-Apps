# Roadmap

This roadmap defines the MVP implementation order. The strategy is to ship a strong job application tracker first, with the database already shaped for later AI features.

## Phase 1: Project Setup

- Create the Next.js app with TypeScript, Tailwind CSS, and ESLint.
- Add Prisma, PostgreSQL, Auth.js or NextAuth, and Zod.
- Configure environment variables.
- Add the initial `prisma/schema.prisma` from `docs/schema.md`.
- Confirm the app can run locally before building product features.

Validation:

- `npm run lint`
- Initial Prisma migration runs successfully.
- Local app boots without runtime errors.

## Phase 2: Design Foundation

- Define the authenticated app shell.
- Add dashboard navigation.
- Build reusable UI primitives: button, input, textarea, select, badge, card, and basic form wrappers as needed.
- Establish loading, empty, and error states early.

Validation:

- Pages have stable responsive layout.
- Form controls are labeled and keyboard-accessible.
- Empty states are useful, not placeholder filler.

## Phase 3: Authentication

- Add sign-up, sign-in, and sign-out.
- Add protected app routes.
- Create `requireUser()` for server-side route protection.
- Confirm user-owned data cannot be accessed while signed out.

Validation:

- Signed-out users are redirected from protected routes.
- Authenticated pages always resolve the current user server-side.

## Phase 4: Database Models

- Add required auth models for the selected auth provider.
- Add `Job`, `Note`, `JobAnalysis`, and enums.
- Run the first product migration.
- Seed a small amount of sample data only if it improves development speed.

Validation:

- Prisma Client generates successfully.
- Cascade behavior and indexes match `docs/schema.md`.

## Phase 5: Job Creation

- Build `/jobs/new`.
- Add a Zod schema for job input.
- Add a create-job server action.
- Redirect to the job detail page after successful creation.

Validation:

- Required fields are enforced.
- Invalid URLs and invalid salary ranges are rejected.
- Created jobs are owned by the authenticated user, not by submitted form data.

## Phase 6: Job List

- Build `/jobs`.
- Add filtering by application status.
- Add search by title and company.
- Sort newest first for MVP.
- Add an empty state.

Validation:

- Users only see their own jobs.
- Filters and search compose predictably.
- Empty states distinguish no jobs from no matching jobs.

## Phase 7: Dashboard

- Build `/dashboard`.
- Show status counts.
- Show recent jobs.
- Show next deadlines or follow-ups when present.

Validation:

- Counts are scoped by user.
- Dashboard remains useful with zero, few, and many jobs.

## Phase 8: Job Detail

- Build `/jobs/[jobId]`.
- Show job metadata and full description.
- Add status update controls.
- Display applied date, deadline, and follow-up date when present.
- Add a basic analysis placeholder section.

Validation:

- Unknown or unauthorized jobs return the appropriate not-found or redirect behavior.
- Status updates persist and refresh the right views.

## Phase 9: Notes

- Add note creation on the job detail page.
- Add note list.
- Add note deletion first; note editing can follow if it remains low-cost.

Validation:

- Notes are scoped to both the current user and the current job.
- Empty notes state is clear.
- Deleting a job deletes its notes.

## Phase 10: Edit Job

- Build `/jobs/[jobId]/edit`.
- Reuse the job form where it improves clarity.
- Add an update-job server action.

Validation:

- Ownership checks prevent cross-user edits.
- Existing values hydrate correctly.
- Validation matches job creation rules.

## Phase 11: Basic Analysis Placeholder

- Display stored `JobAnalysis` fields on job detail.
- Show a clear empty analysis state.
- Optionally allow manual keyword or skill entry only if it does not distract from the core tracker.

Validation:

- Analysis remains optional.
- Empty analysis does not block the job detail workflow.

## Phase 12: Polish Pass

- Improve responsive layout.
- Add loading states.
- Add form error states.
- Add pending UI for status changes where useful.
- Tighten naming and file boundaries.

Validation:

- Manual walkthrough of the primary workflows.
- Accessibility pass for forms, buttons, and navigation.
- No obvious layout overlap on mobile or desktop.

## Phase 13: Testing

- Add focused tests for validation schemas if test tooling is included.
- Add integration-style checks around server actions where practical.
- Manually test auth boundaries and user data isolation.

Validation:

- Lint passes.
- Tests pass if configured.
- Critical user-owned data paths are manually verified.

## Phase 14: Portfolio Finish

- Add README with product framing, setup instructions, tech decisions, schema overview, and screenshots.
- Add deployment notes.
- Add future AI roadmap section.
- Record major architecture decisions under `docs/decisions/` as they arise.

Validation:

- A reviewer can understand what the app does, how to run it, and why the architecture choices were made.
- The app has a complete MVP narrative instead of looking like an unfinished AI demo.
