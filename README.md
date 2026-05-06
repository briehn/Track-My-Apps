# Track My Apps

Track My Apps is a deployed full-stack job application tracker with AI-powered job description analysis.

Live app: [trackmyapps.dev](https://trackmyapps.dev)

The current MVP is intentionally a polished tracker first, with grounded AI features layered on top of real saved job data. The core workflow is complete, while resume matching, interview prep, importing, and deeper analytics remain planned.

## Why This Project Exists

Job searching creates scattered information: job descriptions, company details, statuses, follow-up dates, recruiter notes, interview notes, and resume tailoring decisions. This project brings that workflow into one authenticated app while demonstrating production-minded full-stack engineering.

The goal is to ship a useful tracker first and add AI features that are grounded in real user data rather than speculative prompts. That keeps the product practical today and gives future AI features a structured foundation.

## Implemented Features

- Google OAuth sign-in with Prisma-backed NextAuth sessions
- Deployed custom domain at `trackmyapps.dev`
- Protected application shell for authenticated routes
- Private canonical career profile page with structured target titles, experience ranges, and multi-select work preferences
- Dashboard summary for active jobs, status counts, recent jobs, and upcoming dates
- Manual job creation with server-side Zod validation
- Authenticated active jobs list at `/jobs`
- Archived jobs view at `/jobs?status=archived`
- Job detail pages with posting metadata, dates, description, and management actions
- Full-card job navigation from list and dashboard views
- Status updates from the job detail page with auto-save feedback
- Job editing from `/jobs/[jobId]/edit`
- Archive and permanent delete actions
- Timestamped job notes with create, list, and delete behavior
- Manual AI job description analysis with structured saved results
- Structured analysis stored in `JobAnalysis`
- AI usage protections for 10,000-character input max and production-only per-user daily limits
- Focused Vitest unit tests for core validation and helper logic
- User-owned data access enforced server-side through `requireUser()`
- Prisma schema for job analysis and usage tracking
- Reusable UI primitives for buttons, inputs, textareas, badges, cards, and empty states

## Planned Features

These are future scope and are not currently implemented:

- Resume upload and parsing
- Resume-to-job match scoring
- Skill gap detection
- Tailored resume bullet suggestions
- Cover letter generation
- Interview prep based on saved job descriptions
- Browser extension or URL-based job importing
- Advanced search, filtering, charts, and analytics
- Note editing

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- NextAuth with Google OAuth
- OpenAI
- Zod

This stack was chosen to demonstrate modern full-stack TypeScript architecture, server-side data access, explicit validation, and clear user ownership boundaries.

## Architecture Overview

The app uses the Next.js App Router with Server Components for protected data views and Server Actions for form mutations.

Key architecture decisions:

- Route groups separate public auth screens from authenticated app routes.
- Pages stay focused on route-level composition.
- Feature folders own domain-specific actions, queries, schemas, and components.
- Database access remains server-side.
- Server Actions validate input, check ownership, mutate data, and revalidate or redirect.
- Client Components are used only where browser interactivity is needed.

Current source organization:

```text
src/
  app/
    (auth)/
    (dashboard)/
    api/
    layout.tsx
    page.tsx
    globals.css

  components/
    ui/
    layout/
    empty-states/

  features/
    auth/
    jobs/
    profiles/
    notes/

  server/
    db/
```

See [docs/architecture.md](docs/architecture.md) for the full architecture notes.

## Database Overview

The implemented database model is centered on authenticated, user-owned job search data and saved AI analysis.

Core models:

- `User`: authenticated user and owner of product data
- `UserProfile`: one private canonical profile per user, including target role, suggested location preference text, multi-select work preferences, experience range, skills, resume text, and career links
- `Job`: saved job posting, application status, dates, salary range, source, URL, and description
- `Note`: timestamped notes attached to a job
- `JobAnalysis`: structured AI analysis fields linked to a job, including summary, skills, responsibilities, keywords, and seniority
- `JobAnalysisRun`: usage tracking for AI analysis runs, including optional model and token metadata
- `Account`, `Session`, and `VerificationToken`: NextAuth Prisma adapter models

Primary enums:

- `ApplicationStatus`: `SAVED`, `APPLIED`, `INTERVIEWING`, `OFFER`, `REJECTED`, `ARCHIVED`
- `RemoteType`: `ONSITE`, `HYBRID`, `REMOTE`
- `ExperienceRange`: `ZERO_TO_ONE`, `ONE_TO_TWO`, `THREE_TO_FIVE`, `SIX_TO_NINE`, `TEN_PLUS`
- `EmploymentType`: `FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERNSHIP`, `TEMPORARY`

Jobs, notes, and the canonical profile are scoped to the authenticated user. Job analysis is owned through its required job relation.
AI usage tracking is scoped to the authenticated user and job through `JobAnalysisRun`.

See [docs/schema.md](docs/schema.md) and [prisma/schema.prisma](prisma/schema.prisma) for schema details.

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Configure the values in `.env`:

```bash
DATABASE_URL=
DIRECT_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
OPENAI_API_KEY=
OPENAI_MODEL=
```

For Neon, use the pooled connection string for `DATABASE_URL` and the direct, non-pooled connection string for `DIRECT_URL`. Prisma CLI commands use `DIRECT_URL` through `prisma.config.ts` so migrations do not run through the connection pooler.

Generate a strong `NEXTAUTH_SECRET`, then create a Google OAuth client and add this local callback URL:

```text
http://localhost:3000/api/auth/callback/google
```

Apply database migrations:

```bash
npm run prisma:migrate
```

Generate Prisma Client:

```bash
npm run prisma:generate
```

If you change `prisma/schema.prisma` and see stale Prisma field errors during local development, regenerate Prisma Client and restart the dev server. If the issue persists, remove `.next` and start `npm run dev` again.

Start the development server:

```bash
npm run dev
```

The app runs at `http://localhost:3000` by default. Visit `http://localhost:3000/sign-in` to sign in with Google.

For AI job analysis, set `OPENAI_API_KEY` and choose a model in `OPENAI_MODEL`. The default placeholder uses `gpt-4o-mini` to keep MVP analysis costs lower.
AI analysis is manually triggered only. In production, the app also enforces a small per-user daily analysis limit and blocks descriptions longer than 10,000 characters before calling OpenAI.

## Development Commands

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run test:watch
npm run prisma:generate
npm run prisma:migrate
```

`npm run prisma:migrate` requires a reachable PostgreSQL database configured through `DIRECT_URL`.

## Deployment Notes

This app is suitable for deployment on Vercel with a hosted PostgreSQL database such as Neon.

Deployment checklist:

- Use Node.js `22.x` locally and in Vercel for consistent builds.
- Set all environment variables from `.env.example` in the deployment platform.
- This project uses a NextAuth v4-style config, so production auth settings should use `NEXTAUTH_SECRET` and `NEXTAUTH_URL`.
- Use a pooled Neon URL for `DATABASE_URL`.
- Use a direct Neon URL for `DIRECT_URL`.
- Set `NEXTAUTH_URL` to the production domain.
- Set `NEXTAUTH_SECRET` to a strong random value that is stable across deployments.
- Set `OPENAI_API_KEY` for server-side AI analysis requests.
- Set `OPENAI_MODEL` to the model you want the analysis action to use.
- Production AI analysis is limited per authenticated user per day and skips descriptions longer than 10,000 characters.
- Add the production Google OAuth callback URL in Google Cloud Console:

```text
https://your-domain.com/api/auth/callback/google
```

- Run Prisma migrations against the production database before using the app.
- Prisma Client is generated during install via `postinstall`, which helps keep Vercel builds aligned with the checked-in schema.
- Do not commit real `.env` values.

## Screenshots

### Sign In

![Sign in screen](public/screenshots/sign-in.png)

Clean entry point for Google OAuth access to the tracker.

### Dashboard

![Dashboard summary](public/screenshots/dashboard.png)

High-level view of active jobs, status counts, recent jobs, and upcoming dates.

### Jobs List

![Jobs list](public/screenshots/jobs-list.png)

Scannable list of saved jobs with status, company, and key metadata.

### Job Detail

![Job detail page](public/screenshots/job-detail.png)

Full saved posting view with status controls, notes, management actions, and job metadata.

## Project Status

Status: Deployed MVP is complete; post-MVP AI and product expansion work is underway.

Completed:

- Product scope, architecture notes, schema notes, roadmap, and decision record
- Next.js App Router foundation
- TypeScript, Tailwind, and ESLint setup
- Prisma schema, Prisma 7 config, and initial PostgreSQL migration
- Google OAuth authentication with Prisma-backed sessions
- Protected dashboard and jobs app shell
- Manual job creation, listing, detail, editing, status updates, archive/delete, and notes
- Manual AI job description analysis saved to `JobAnalysis`
- AI usage protections and usage tracking for analysis runs
- Vitest unit tests for core validation and helper logic
- Dashboard summaries and focused MVP polish pass
- Deployed custom domain and production release

Not yet implemented:

- Resume upload and parsing
- Resume-to-job matching
- URL-based job importing
- Advanced filtering/search
- Dashboard charts and advanced analytics
- Browser-level and integration test coverage
- Production deployment

## Roadmap

The implementation roadmap is documented in [docs/roadmap.md](docs/roadmap.md).

Current focus:

- Maintain the deployed MVP tracker workflow.
- Improve AI analysis quality, reliability, and observability.
- Add resume/profile foundations before any matching features.
- Expand the profile foundation before adding any resume-to-job matching logic.
- Add importing, search, filtering, and analytics only when they serve the workflow.
- Expand testing and reliability around the highest-value pure logic first.

## What This Project Demonstrates

This project is intended to demonstrate more than basic CRUD.

Engineering priorities:

- Product-first scoping
- Modern Next.js App Router architecture
- Clear server/client boundaries
- Type-safe full-stack development
- Prisma data modeling
- User data ownership and authorization checks
- Schema-based validation with Zod
- Maintainable feature-oriented folder structure
- Practical UX for repeated workflows
- Implemented AI integration with structured output validation and normalization
- AI usage limits and save-path tracking
- Focused automated testing for core validation and helper logic
- Deployed production readiness with a live custom domain
- AI-ready product design without premature AI complexity

The main technical decision is to build a strong tracker before adding AI generation. That keeps the MVP useful on its own and gives future AI features real structured data to work with.
