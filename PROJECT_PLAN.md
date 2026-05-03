# AI Job Search Copilot

`PROJECT_PLAN.md` is the product source of truth. Supporting technical details live in focused docs so they can evolve without turning this file into a catch-all.

## Product Goal

Build a production-quality portfolio project that helps users save job postings, track applications, keep interview notes, and prepare the data foundation for later AI-assisted job search workflows.

The MVP should be a polished job application tracker first. AI-facing data structures are included early, but full AI generation is intentionally later scope.

## Target User

The primary user is an active job seeker who needs one reliable place to track roles, application status, notes, deadlines, and follow-ups.

The portfolio audience is also important: the codebase should demonstrate clear architecture, type safety, validation, data ownership, and pragmatic product judgment.

## Tech Stack

- Next.js with App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- Auth.js or NextAuth
- Zod

See [docs/architecture.md](docs/architecture.md) for the App Router rationale and code organization.

## MVP Scope

1. Authentication
   - Sign up, sign in, and sign out.
   - Protected app routes.
   - User-owned data only.

2. Dashboard
   - Application status summary.
   - Recent saved jobs.
   - Jobs grouped or summarized by status.
   - Counts for saved, applied, interviewing, offer, rejected, and archived.

3. Manual job saving
   - Create jobs manually.
   - Capture company, title, location, remote type, job URL, salary range, description, source, and deadline.
   - No scraping in MVP.

4. Application tracking
   - Track status workflow: `SAVED`, `APPLIED`, `INTERVIEWING`, `OFFER`, `REJECTED`, `ARCHIVED`.
   - Track applied date.
   - Track optional deadline and follow-up date.

5. Job detail page
   - Show full job description.
   - Show company and title metadata.
   - Provide status controls.
   - Show notes.
   - Include a basic analysis placeholder.

6. Notes
   - Multiple notes per job.
   - Timestamped note history.
   - Useful for recruiter calls, interviews, follow-ups, and decision-making.

7. Basic job analysis structure
   - Store extracted keywords, skills, responsibilities, and requirements.
   - In MVP, analysis can be manually created or empty.
   - The point is to prepare the data model for later AI features without blocking the tracker.

See [docs/schema.md](docs/schema.md) for the canonical Prisma schema and ownership rules.

## Later Scope

- Resume upload and parsing.
- AI job description analysis.
- Resume-to-job match score.
- Skill gap detection.
- Tailored resume bullets.
- Cover letter generation.
- Interview prep.
- Browser extension.
- Job scraping or importing.

## Product Priorities

- Portfolio-quality implementation.
- Clean architecture with clear folder boundaries.
- Strong backend fundamentals.
- Explicit validation at server boundaries.
- User data isolation.
- Type-safe code.
- Reusable components where reuse is real.
- Good UX for repeated job-tracking workflows.
- Production-minded decisions without premature complexity.

## Non-Goals

- Tutorial-style code.
- Overengineering before the MVP needs it.
- Giant route components that mix UI, validation, data access, and business logic.
- Weak naming or vague domain concepts.
- AI features that make the tracker feel unfinished.

## Documentation Map

- [docs/architecture.md](docs/architecture.md): App Router rationale, folder structure, server/client boundaries, and file conventions.
- [docs/schema.md](docs/schema.md): canonical Prisma schema, ownership rules, cascade behavior, indexes, and validation notes.
- [docs/roadmap.md](docs/roadmap.md): MVP build phases and validation expectations.
- [docs/decisions/initial-scope.md](docs/decisions/initial-scope.md): initial scope decision record.
- [AGENTS.md](AGENTS.md): durable collaboration and code-quality guidance for AI-assisted work in this repository.

## Build Strategy

Build the tracker in small, defensible phases. The implementation order is defined in [docs/roadmap.md](docs/roadmap.md).

The key MVP decision is to ship a strong tracker first, with the database already shaped for AI. That creates a complete usable app instead of an unfinished AI demo.
