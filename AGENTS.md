# Project Working Agreement

## Workspace Boundary

- This directory (`/Users/dannyleung/Documents/New project`) is the project's only working directory.
- Keep all source code, configuration, SQL, documentation, design assets, generated artifacts, and temporary project files inside this directory.
- Do not create, edit, move, copy, or delete project files outside this directory without the user's explicit permission.
- Use relative paths in project configuration and documentation whenever possible; never depend on a user-specific absolute path.

## Technical Architecture

This project uses Next.js App Router, TypeScript, Supabase PostgreSQL/Auth, and Vercel:

- Put routes and server endpoints in `app/`.
- Put reusable UI components in `components/` and shared utilities and domain data in `lib/`.
- Preserve the two product journeys: `/free` is an anonymous 8-question acquisition experience; `/premium` is a server-side XHS-entitlement-gated 20-question product. The app does not own price, payment, orders, or code redemption.
- Keep personality data, source questions, scoring, imagery, visual components, and share-card code shared. Never fork personality content into separate free and premium copies.
- Keep free and premium browser storage namespaces separate. Free state must never satisfy a premium route guard.
- Keep business logic, data access, and UI presentation separated; components should not contain direct database or external-service implementation details.
- Store database schema and future migrations in `supabase/`; do not scatter SQL among UI files.
- Keep environment-specific values in local `.env*` files that are ignored by Git. Commit a safe `.env.example` with placeholder values only.
- Keep dependencies and scripts declared in the project manifest; do not rely on globally installed project tooling.

## Personality IP Contract

- 16型恋爱人格使用固定且互不重复的动物IP。TYPE编号是稳定ID，中文名称和视觉资源均通过统一人格数据源映射。未经用户明确要求，不得修改TYPE对应动物，也不得重新引入重复动物。
- `lib/personalities.ts` is the only current personality-content source for free results, premium results, share cards, and administrator statistics. Never create a second personality mapping.
- Keep image filenames stable as `public/personality/type01.webp` through `type16.webp`. Missing files must fall back to the existing placeholder instead of breaking the page.
- Preserve legacy-name compatibility only in a clearly labelled migration layer. Do not display retired names in current UI or documentation.

## File Organization

- Use lowercase, hyphenated filenames for standalone files and folders unless the selected framework convention requires otherwise.
- Keep one clear responsibility per module. Prefer small, composable files over large mixed-purpose files.
- Place static public assets in `public/` and editable design source assets in `assets/` or `design/`.
- Keep project documentation in `README.md` and `docs/`; update documentation when setup, architecture, or user-facing behavior changes.
- Put generated output in a clearly named ignored directory such as `dist/`, `build/`, `coverage/`, or `.generated/`. Do not hand-edit generated files.
- Do not add binary files, credentials, cache directories, dependency directories, or build outputs to version control unless explicitly required.

## Visual Principles

- The visual direction is modern Eastern × independent magazine × personality archive × light dreamscape.
- Favor a calm, collectible, screenshot-worthy interface: clear hierarchy, generous spacing, legible typography, and restrained color use.
- Define reusable design tokens for color, type, spacing, radius, shadows, and interaction states before repeating raw visual values.
- Build responsive layouts from small screens upward and test common narrow and wide viewport states.
- Ensure visible keyboard focus, sufficient color contrast, meaningful labels, and semantic HTML.
- Use consistent component states for loading, empty, error, disabled, hover, focus, and active interactions.
- Do not introduce decorative effects, animation, or imagery that obscures content or harms performance and accessibility.
- Do not use large pink-purple gradients, cheap romantic motifs, excessive glass effects, cartoon buttons, or excessive rounded cards.
- Result art may influence fine lines, dots, and small tags only; never flood the whole page with personality colors.

## Prohibited Actions

- Do not write project-related files outside this directory without explicit user approval.
- Do not delete, overwrite, reset, or mass-reformat existing work without first confirming the exact scope when it is not clearly requested.
- Do not commit secrets, API keys, tokens, passwords, personal data, or production credentials.
- Do not make unverified external network calls, deploy, publish, send messages, or modify third-party services unless the user explicitly asks.
- Do not change package managers, framework foundations, database choices, or build tooling without discussing the impact first.
- Do not use `git reset --hard`, force pushes, or destructive cleanup commands unless the user explicitly requests them.

## Quality Gate

- Before handoff, run the most relevant available checks (formatting, linting, type checking, tests, and build) and report any checks that could not be run.
- Keep changes scoped to the request and preserve unrelated work already present in the repository.
