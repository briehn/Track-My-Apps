# Architecture

This project should use a modern Next.js App Router architecture with clear server-side boundaries for authentication, validation, and database access.

## App Router Rationale

Use App Router for this project.

Reasons:

- It is the current idiomatic direction for modern Next.js applications.
- Server Components fit dashboards, job lists, and job detail pages well because those screens can fetch user-owned data on the server.
- Server Actions are a good fit for form mutations such as creating jobs, updating status, adding notes, and deleting notes.
- Route groups like `(auth)` and `(dashboard)` cleanly separate public auth screens from authenticated app screens.
- It demonstrates current Next.js architecture in a way that is defensible for a portfolio project.

Pages Router is only worth considering for legacy compatibility or when following an existing codebase that already standardizes on it. This project has no such constraint.

## Proposed Folder Structure

```text
src/
  app/
    (auth)/
      sign-in/
        page.tsx
      sign-up/
        page.tsx
    (dashboard)/
      dashboard/
        page.tsx
      jobs/
        page.tsx
        new/
          page.tsx
        [jobId]/
          page.tsx
          edit/
            page.tsx
    api/
      auth/
        [...nextauth]/
          route.ts
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
      auth-options.ts
      require-user.ts
    jobs/
      actions.ts
      components/
      queries.ts
      schemas.ts
      types.ts
    notes/
      actions.ts
      components/
      queries.ts
      schemas.ts
    job-analysis/
      components/
      schemas.ts
      types.ts

  lib/
    utils.ts
    constants.ts

  server/
    db/
      prisma.ts

  styles/
```

This structure keeps routes thin and feature code discoverable. Pages define route-level composition. Feature folders own domain-specific actions, queries, schemas, types, and components.

## File Conventions

- `features/*/actions.ts`: server actions that mutate data.
- `features/*/queries.ts`: server-side data reads.
- `features/*/schemas.ts`: Zod schemas for external input.
- `features/*/types.ts`: feature-specific TypeScript types that are not already covered cleanly by Prisma.
- `features/*/components/`: UI that is specific to one product feature.
- `components/ui/`: reusable primitives such as buttons, inputs, textareas, badges, cards, and dialogs.
- `components/layout/`: app shell, navigation, headers, and layout-level UI.
- `components/forms/`: generic form helpers when reuse is real.
- `components/empty-states/`: reusable empty states that are not tied to a single feature.
- `server/db/prisma.ts`: Prisma client singleton and database access setup.
- `lib/`: small framework-agnostic utilities and constants.

Avoid broad utility files that become a dumping ground. A helper belongs in `lib/` only when it is genuinely shared across features.

## Server and Client Boundaries

Default to Server Components for pages and data-heavy views. Add Client Components only when the UI needs browser state, event handlers, transitions, or client-side interactivity.

Database access should stay server-side:

- Server pages can call feature queries directly.
- Server actions should validate inputs, check ownership, mutate data, and return or redirect.
- Client Components should receive already-authorized data and call server actions through forms or controlled interactions.

This boundary keeps secrets, database access, and authorization checks out of the browser bundle.

## Data Flow

The typical data flow should be:

1. Route page calls `requireUser()`.
2. Route page calls a feature query scoped by `user.id`.
3. Page composes feature components with authorized data.
4. Forms submit to feature server actions.
5. Server actions validate input with Zod, verify ownership, mutate with Prisma, and revalidate or redirect.

This keeps route files readable while making the backend behavior easy to test and review.

## Validation and Errors

Validation should happen at the boundary where untrusted input enters the system. For this app, that usually means server actions.

Use user-facing error messages for predictable validation problems. Keep internal database or stack details out of rendered UI. Unexpected errors should be logged by the server environment and surfaced to users as a generic failure state.

## UI Expectations

The app is an operational tracker, not a marketing page. Prioritize dense but clear workflows:

- Fast job creation.
- Scannable job list and dashboard counts.
- Clear status controls.
- Useful empty, loading, and error states.
- Accessible form labels, keyboard-friendly controls, and semantic structure.
