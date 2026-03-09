# Archlog Constitution

## Core Principles

### I. App Router & Server-First

Use Next.js App Router with Server Components by default. Only add `"use client"` when the component needs interactivity, browser APIs, or React hooks. Keep data fetching on the server.

### II. Simplicity

Start simple, follow YAGNI. No premature abstractions, no over-engineering. Prefer colocation — keep components, styles, and tests close to where they're used.

### III. Type Safety

TypeScript strict mode everywhere. No `any` types unless absolutely unavoidable. Shared types live in a central `types/` directory.

### IV. Testing

Write tests for business logic and critical user flows. Use Jest + React Testing Library. Tests must pass before merging.

### V. Performance

Optimize images with `next/image`, leverage static generation where possible, minimize client-side JavaScript. Use Suspense boundaries for async UI.

### VI. Voice & Copy

No em dashes anywhere in the codebase or user-facing text. Avoid obvious AI writing patterns: no "leverage", "streamline", "empower", "cutting-edge", "robust", "comprehensive", "foster", "harness", "spearheading", "groundbreaking", "paradigm", "synergy". Write like a person. Short sentences. Plain language. If a sentence sounds like a LinkedIn post, rewrite it.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier
- **Package Manager**: npm

## Development Workflow

- Every new change you add requires passing CI checks (lint, type-check, tests, prettier) before finishing

## Governance

This constitution defines the baseline standards for the project. Amendments require updating this document and notifying all contributors.

**Version**: 1.1.0 | **Ratified**: 2026-03-09 | **Last Amended**: 2026-03-09
