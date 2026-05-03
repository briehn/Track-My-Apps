# AI Job Search Copilot

## Short Product Description

AI Job Search Copilot is a full-stack job application tracker designed to help job seekers save roles, track application progress, keep notes, and build a structured foundation for future AI-assisted job search workflows.

The MVP is intentionally focused on being a polished tracker first. AI features are planned later, after the core product data model and user workflows are stable.

## Why I Built This

Job searching creates a lot of scattered information: job descriptions, company details, application statuses, follow-up dates, recruiter notes, interview notes, and resume tailoring decisions. Most job seekers end up tracking that across spreadsheets, browser tabs, documents, and memory.

This project is designed to solve that workflow with a clean, practical application while also demonstrating production-minded full-stack engineering. The goal is not to build a thin AI demo. The goal is to build a useful product foundation that can support AI features in a way that is grounded in real user data.

## Core Features

### Planned MVP Features

- User authentication with protected application routes
- User-owned job records
- Dashboard with application status summaries
- Manual job saving
- Application status tracking
- Job detail pages with full posting metadata
- Notes per job for recruiter calls, interviews, follow-ups, and decision-making
- Basic job analysis data structure for future AI workflows

### Current Repository State

This repository currently contains the product plan, architecture plan, database schema reference, roadmap, initial scope decision, and Phase 1 application foundation.

Implemented foundation:

- Next.js App Router scaffold
- TypeScript configuration
- Tailwind CSS configuration
- ESLint configuration
- Prisma schema and Prisma 7 config
- PostgreSQL driver adapter setup
- NextAuth dependency foundation
- Zod dependency foundation
- Initial architecture folders from `docs/architecture.md`

Product workflows such as authentication screens, dashboards, job pages, notes, and AI features are planned but not implemented yet.

## MVP Scope

The MVP is a job application tracker with the following workflow:

1. A user signs in.
2. The user manually saves a job posting.
3. The user tracks that job through statuses such as saved, applied, interviewing, offer, rejected, and archived.
4. The user adds notes and important dates.
5. The dashboard summarizes active job search activity.
6. The job detail page becomes the source of truth for a single opportunity.

The MVP does not include job scraping, browser automation, resume parsing, AI-generated documents, or match scoring. Those features depend on a reliable data foundation first.

## Future AI Features

The long-term direction is to add AI workflows on top of the tracker once the MVP is stable:

- Job description analysis
- Resume upload and parsing
- Resume-to-job match scoring
- Skill gap detection
- Tailored resume bullet suggestions
- Cover letter generation
- Interview prep based on a saved job description
- Browser extension or job import workflow

These are future features, not current MVP functionality.

## Tech Stack

Current foundation stack:

- Next.js with App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- NextAuth
- Zod

This stack was chosen to demonstrate modern full-stack TypeScript architecture, server-side data access, explicit validation, and clear ownership boundaries.

## Architecture Overview

The architecture uses the Next.js App Router with Server Components and Server Actions where they fit naturally.

Key architecture decisions:

- Route groups separate authentication screens from authenticated app routes.
- Pages stay focused on route-level composition.
- Feature folders own domain-specific actions, queries, schemas, types, and components.
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
    forms/
    empty-states/

  features/
    auth/
    jobs/
    notes/
    job-analysis/

  lib/
  server/
    db/
```

See [docs/architecture.md](docs/architecture.md) for the full architecture notes.

## Database Overview

The planned database model is centered on user-owned job search data.

Core product models:

- `User`: authenticated user and owner of product data
- `Job`: saved job posting, status, dates, salary range, source, and description
- `Note`: timestamped notes attached to a job
- `JobAnalysis`: optional structured analysis fields for future AI workflows

Primary enums:

- `ApplicationStatus`: `SAVED`, `APPLIED`, `INTERVIEWING`, `OFFER`, `REJECTED`, `ARCHIVED`
- `RemoteType`: `ONSITE`, `HYBRID`, `REMOTE`
- `EmploymentType`: `FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERNSHIP`, `TEMPORARY`

The schema is designed around ownership checks. Jobs and notes are scoped to the authenticated user, and job analysis is owned through its required job relation.

See [docs/schema.md](docs/schema.md) for the canonical Prisma schema and data ownership rules.

## Getting Started / Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Update `DATABASE_URL` in `.env` if your local PostgreSQL credentials or database name differ from the example.

For Neon, use the pooled connection string for `DATABASE_URL` and the direct, non-pooled connection string for `DIRECT_URL`. Prisma CLI commands use `DIRECT_URL` through `prisma.config.ts` so migrations do not run through the connection pooler.

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

The app runs at `http://localhost:3000` by default.

## Environment Variables

See [.env.example](.env.example).

```bash
DATABASE_URL=
DIRECT_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

Additional provider-specific authentication variables may be added when authentication is implemented.

## Development Commands

```bash
npm run dev
npm run build
npm run lint
npm run prisma:generate
npm run prisma:migrate
```

`npm run prisma:migrate` requires a reachable PostgreSQL database configured through `DIRECT_URL`.
With Neon, `DATABASE_URL` should be pooled for application runtime and `DIRECT_URL` should be direct for Prisma migrations.

## Project Status

Status: Phase 1 foundation complete.

Completed:

- Product scope
- MVP definition
- Architecture plan
- Database schema plan
- Implementation roadmap
- Initial scope decision record
- Next.js App Router foundation
- TypeScript, Tailwind, and ESLint setup
- Prisma schema and client generation setup
- Initial PostgreSQL migration applied through Prisma Migrate
- Environment variable example
- Initial folder structure

Not yet implemented:

- Authentication
- Job tracking UI
- Dashboard
- Notes
- AI features

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

## Screenshots

Screenshots will be added after the UI is implemented.

Planned screenshots:

- Dashboard
- Job list
- New job form
- Job detail page
- Notes workflow

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
