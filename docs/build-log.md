# Build Log

This log tracks meaningful project progress by date.

It should document what changed, why it mattered, and what the next step is. It is not meant to list every tiny code edit.

---

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

### Next Step
- Add notes next so users can capture context for a saved job.
