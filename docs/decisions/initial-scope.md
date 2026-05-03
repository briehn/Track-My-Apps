# Initial Scope Decision

## Status

Accepted

## Context

AI Job Search Copilot is a production-quality portfolio app meant to help job seekers save jobs, track applications, add notes, and eventually use AI to analyze job descriptions, compare resumes, generate tailored resume bullets, create cover letters, and support interview prep.

AI features are important to the long-term product direction, but they depend on reliable core product data first. Useful AI workflows need structured users, jobs, descriptions, statuses, notes, and application history. Without that foundation, AI output would be detached from a real workflow and difficult to validate.

## Decision

The MVP will focus on:

- authentication
- dashboard
- manual job saving
- application status tracking
- job detail pages
- notes
- basic `JobAnalysis` data structure for future AI features

The MVP will not include:

- resume parsing
- AI-generated cover letters
- resume-job match scoring
- skill gap detection
- interview prep generation
- job scraping
- browser extension

## Rationale

A complete tracker is more valuable than an unfinished AI demo. Users can immediately save roles, track progress, and keep notes, even before any generation or analysis features exist.

AI features need clean, structured product data to work well. Building that data foundation first makes future analysis, matching, and generation features easier to implement and easier to explain.

Building the tracker first proves full-stack fundamentals: authentication, authorization, database modeling, validation, server-side data access, forms, and practical UX. That creates a stronger portfolio story than shipping a thin AI wrapper around weak product foundations.

This scope also reduces risk. The app can reach a finished MVP without depending on prompt quality, model selection, document parsing, vector search, or external AI costs. Future AI features can then be layered in cleanly when the core workflow is stable.

## Alternatives Considered

1. Build AI features first.

   Rejected because it risks becoming a shallow demo without a useful product foundation.

2. Build a simple CRUD tracker only.

   Rejected because it would not show enough product ambition or future AI direction.

3. Build tracker MVP with AI-ready architecture.

   Accepted because it balances usefulness, technical depth, and future expansion.

## Consequences

Positive:

- The MVP can be finished and used.
- The codebase has a stable foundation.
- Future AI work has real data to operate on.
- The project is easier to explain in interviews.

Tradeoffs:

- AI features arrive later.
- Some schema decisions need to anticipate future AI use.
- The project must avoid overengineering for features that do not exist yet.

## Follow-up Decisions

Future decisions that should get their own docs:

- AI provider choice
- resume storage/parsing strategy
- whether to use embeddings/vector search
- how to store AI-generated outputs
- whether to add job scraping/importing
- deployment/database hosting choice
