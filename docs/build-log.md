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

### Notes
- The MVP will focus on a polished job application tracker before adding AI features.
- AI features will be layered in after the core tracker, auth, database, and notes workflows are stable.
- The initial migration establishes the auth-adjacent tables, job tracking tables, notes, job analysis placeholder, enums, indexes, and cascade relationships.
- Authentication now has the server-side foundation needed for future protected routes and user-owned data checks, but custom auth UI is still intentionally deferred.
- The protected auth-check route is temporary validation scaffolding, not a dashboard feature.

### Next Step
- Replace the auth-check scaffold with the first real protected app shell once the Google OAuth flow has been manually verified.
