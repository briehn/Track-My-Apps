# Track My Apps

Track My Apps is a private job-search workspace for organizing applications, staying on top of next steps, and using AI guidance grounded in saved career data.

## Live Application

**[Open Track My Apps](https://trackmyapps.dev)**

![Track My Apps dashboard showing Today's Focus and an application pipeline](public/screenshots/dashboard.png)

## Features

- **Private workspace:** Google sign-in and account-scoped application data.
- **Application tracking:** Save roles, update statuses, add notes and dates, then archive or remove applications.
- **Search focus:** A dashboard surfaces follow-ups, upcoming deadlines, missing analysis, interview preparation, and pipeline progress.
- **Flexible job views:** Browse active or archived applications in card or table layouts, with search, filters, and sorting.
- **Portable data:** Import CSV files through a validated review flow and export applications as CSV or formatted XLSX.
- **Career profile and resume intake:** Maintain a canonical profile and import text, DOCX, or PDF resumes for review-first profile suggestions.
- **Contextual AI tools:** Analyze saved job descriptions, compare them with a profile, and generate interview-preparation guidance with production usage limits.

## Product Showcase

| Jobs workspace | Import review |
| --- | --- |
| ![Jobs workspace in card view](public/screenshots/jobs-list.png) | ![CSV import validation preview](public/screenshots/csv_import.png) |

| Job details | Profile suggestions |
| --- | --- |
| ![Job details with application status and AI insights](public/screenshots/job-detail.png) | ![AI-generated profile suggestions ready for review](public/screenshots/profile_extraction.png) |

## Tech Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- Prisma and PostgreSQL
- NextAuth with Google OAuth
- OpenAI, Zod, Vitest, htmlparser2 (safe external-description text normalization)
- Upstash Redis for production rate limiting

## Engineering

The app keeps data access on the server, scopes reads and writes to the authenticated user, and validates inputs at feature boundaries. AI output is structured and review-first; durable application data remains separate from transient guidance. Core schemas and helper logic have focused Vitest coverage.

## Further Reading

Technical documentation is available in [docs/](docs/), including the architecture, schema, roadmap, and build log.
