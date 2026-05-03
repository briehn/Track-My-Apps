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

This repository currently contains the product plan, architecture plan, database schema reference, roadmap, and initial scope decision. The application scaffold and product implementation are planned next.

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

Planned stack:

- Next.js with App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- Auth.js or NextAuth
- Zod

This stack was chosen to demonstrate modern full-stack TypeScript architecture, server-side data access, explicit validation, and clear ownership boundaries.

## Architecture Overview

The planned architecture uses the Next.js App Router with Server Components and Server Actions where they fit naturally.

Key architecture decisions:

- Route groups separate authentication screens from authenticated app routes.
- Pages stay focused on route-level composition.
- Feature folders own domain-specific actions, queries, schemas, types, and components.
- Database access remains server-side.
- Server Actions validate input, check ownership, mutate data, and revalidate or redirect.
- Client Components are used only where browser interactivity is needed.

Planned source organization:

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

The application scaffold has not been generated yet, so local setup commands are not available in this repository yet.

Once the Next.js app is added, this section should include:

```bash
npm install
npm run dev
```

The exact setup steps will be updated after `package.json`, Prisma configuration, and environment variable examples are added.

## Environment Variables

No `.env.example` file exists yet.

Expected future environment variables will likely include:

```bash
DATABASE_URL=
AUTH_SECRET=
AUTH_URL=
```

Additional provider-specific authentication variables may be needed depending on the selected Auth.js or NextAuth provider setup.

## Development Commands

No `package.json` exists yet, so development scripts are not currently defined.

Planned commands will likely include:

```bash
npm run dev
npm run lint
npx prisma generate
npx prisma migrate dev
```

This section should be updated with the real scripts after project setup is complete.

## Project Status

Status: planning and architecture phase.

Completed:

- Product scope
- MVP definition
- Architecture plan
- Database schema plan
- Implementation roadmap
- Initial scope decision record

Not yet implemented:

- Next.js application scaffold
- Authentication
- Prisma setup and migrations
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
