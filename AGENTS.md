# AGENTS.md - Universal Agent Context Standard

> Project: mh-persian-writer
> Generated via M.H. AI Sync (Single Source of Truth)

## Overview
Comprehensive Persian (Farsi) language toolkit for text normalization, formal/administrative writing, grammar analysis, number utilities, and validation.

## Commands & Workflows
- **install**: `npm install`
- **build**: `npm run build`
- **test**: `npm test`
- **lint**: `npm run lint`
- **dev**: `npm run dev`
- **typecheck**: `npm run typecheck`

## Development Rules
### Code Style
- Follow Clean Code and DRY principles.
- Write type-safe and self-documenting TypeScript code.
- Keep functions focused on a single responsibility.
- Use JSDoc comments on every exported function.
- Write Persian comments where they aid understanding.
- Zero external runtime dependencies.

### Git Workflow
- Use conventional commits (feat:, fix:, chore:, refactor:).
- Do not push broken builds or failing tests.

### Agent Constraints
- Preserve existing comments and docstrings.
- Always verify syntax and run test suites before finalizing changes.
- Prefer minimal and surgical edits over rewriting entire files.
- Import types from `./types` and constants from `./constants`.
