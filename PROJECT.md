# Project Overview

## Status

Version 1 of the Chinese mobile H5 product “16型恋爱人格测试” is implemented and preparing for production configuration and deployment.

The product now has two independent journeys: a free 8-question acquisition experience at `/free` and the original redeem-gated premium experience at `/premium`. The root path redirects to `/premium` for backward compatibility with existing sales links.

## Workspace Scope

`/Users/dannyleung/Documents/New project` is the only authorized project workspace. All code, configuration, SQL, documentation, assets, and generated output must remain inside this directory unless the user explicitly authorizes an exception.

## Architecture Baseline

- Next.js App Router + TypeScript for the mobile H5 and server API routes
- Supabase PostgreSQL for redeem codes, attempts, anonymous result statistics, and administrator accounts
- Server-only Supabase service key for all protected operations; no business tables are directly readable from the browser
- Vercel as the intended production deployment target
- Local storage only for session continuity, unfinished answers, and the latest result; the database remains authoritative
- Shared personality/question/scoring/UI resources with isolated free and premium route and storage namespaces

## Engineering Principles

- Keep implementation scoped, understandable, and testable.
- Use version-controlled configuration templates; never commit real secrets.
- Keep dependencies and build scripts declared in the project manifest.
- Treat `AGENTS.md` as the mandatory operating agreement for all project work.

## Change Log

| Date | Change |
| --- | --- |
| 2026-08-09 | Created initial project overview and repository baseline. |
| 2026-08-09 | Implemented the first production-oriented love personality test product. |
| 2026-08-09 | Added the independent free acquisition journey and reorganized shared resources. |
