# AI Job Search Copilot

AI Job Search Copilot is a full-stack job application tracker for saving roles, tracking application progress, keeping notes, and building a structured foundation for future AI-assisted job search workflows.

The current MVP is intentionally a polished tracker first. AI features are planned later, after the core product workflow, data model, and ownership boundaries are stable.

## Why This Project Exists

Job searching creates scattered information: job descriptions, company details, statuses, follow-up dates, recruiter notes, interview notes, and resume tailoring decisions. This project brings that workflow into one authenticated app while demonstrating production-minded full-stack engineering.

The goal is not to ship a thin AI demo. The goal is to build a useful product foundation that can support AI features in a way that is grounded in real user data.

## Implemented Features

- Google OAuth sign-in with Prisma-backed NextAuth sessions
- Protected application shell for authenticated routes
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
- User-owned data access enforced server-side through `requireUser()`
- Prisma schema for future job analysis data
- Reusable UI primitives for buttons, inputs, textareas, badges, cards, and empty states

## Planned Features

These are future scope and are not currently implemented:

- AI job description analysis
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
    notes/

  server/
    db/
```

See [docs/architecture.md](docs/architecture.md) for the full architecture notes.

## Database Overview

The implemented database model is centered on authenticated, user-owned job search data.

Core models:

- `User`: authenticated user and owner of product data
- `Job`: saved job posting, application status, dates, salary range, source, URL, and description
- `Note`: timestamped notes attached to a job
- `JobAnalysis`: optional structured analysis fields reserved for future AI workflows
- `Account`, `Session`, and `VerificationToken`: NextAuth Prisma adapter models

Primary enums:

- `ApplicationStatus`: `SAVED`, `APPLIED`, `INTERVIEWING`, `OFFER`, `REJECTED`, `ARCHIVED`
- `RemoteType`: `ONSITE`, `HYBRID`, `REMOTE`
- `EmploymentType`: `FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERNSHIP`, `TEMPORARY`

Jobs and notes are scoped to the authenticated user. Job analysis is owned through its required job relation.

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

Start the development server:

```bash
npm run dev
```

The app runs at `http://localhost:3000` by default. Visit `http://localhost:3000/sign-in` to sign in with Google.

## Development Commands

```bash
npm run dev
npm run build
npm run lint
npm run prisma:generate
npm run prisma:migrate
```

`npm run prisma:migrate` requires a reachable PostgreSQL database configured through `DIRECT_URL`.

## Deployment Notes

This app is suitable for deployment on Vercel with a hosted PostgreSQL database such as Neon.

Deployment checklist:

- Set all environment variables from `.env.example` in the deployment platform.
- Use a pooled Neon URL for `DATABASE_URL`.
- Use a direct Neon URL for `DIRECT_URL`.
- Set `NEXTAUTH_URL` to the production domain.
- Add the production Google OAuth callback URL in Google Cloud Console:

```text
https://your-domain.com/api/auth/callback/google
```

- Run Prisma migrations against the production database before using the app.
- Do not commit real `.env` values.

## Screenshots

Screenshots are not committed yet. Recommended portfolio screenshots:

- Dashboard summary
- Active jobs list
- Archived jobs view
- New job form
- Job detail page with notes
- Edit job page

## Project Status

Status: MVP tracker workflow implemented locally; portfolio/deployment readiness in progress.

Completed:

- Product scope, architecture notes, schema notes, roadmap, and decision record
- Next.js App Router foundation
- TypeScript, Tailwind, and ESLint setup
- Prisma schema, Prisma 7 config, and initial PostgreSQL migration
- Google OAuth authentication with Prisma-backed sessions
- Protected dashboard and jobs app shell
- Manual job creation, listing, detail, editing, status updates, archive/delete, and notes
- Dashboard summaries and focused MVP polish pass
- Safe environment variable example

Not yet implemented:

- AI features
- Resume features
- URL-based job importing
- Advanced filtering/search
- Dashboard charts and advanced analytics
- Automated tests
- Production deployment

## Roadmap

The implementation roadmap is documented in [docs/roadmap.md](docs/roadmap.md).

High-level phases:

1. Project setup
2. Design foundation
3. Authentication
4. Database models
5. Job creation
6. Job list
7. Dashboard
8. Job detail page
9. Notes
10. Edit job
11. Basic analysis placeholder
12. Polish pass
13. Testing
14. Portfolio finish

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
- AI-ready product design without premature AI complexity

The main technical decision is to build a strong tracker before adding AI generation. That keeps the MVP useful on its own and gives future AI features real structured data to work with.
