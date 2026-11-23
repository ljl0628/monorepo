# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies
pnpm install

# Build all packages (Turborepo handles dependency order)
pnpm build

# Build a single package
pnpm build:shared     # packages/shared
pnpm build:ui         # packages/ui
pnpm build:web        # apps/web
pnpm build:server     # apps/server

# Dev servers (long-running, not cached)
pnpm dev:web          # Vite dev server on port 3000
pnpm dev:server       # Express API server on port 4000 (tsx watch)

# Lint & clean
pnpm lint             # runs lint in all packages
pnpm clean            # deletes all dist/ and tsbuildinfo files
```

No test framework is currently configured.

## Architecture

TypeScript monorepo using **pnpm workspaces** + **Turborepo** + **TypeScript project references**.

### Dependency Graph

```
@monorepo/shared  ← leaf package, types & utils (ApiResponse<T>, User, createResponse)
├── @monorepo/ui  ← shared React components (Button), peer-dep: react ≥18
├── @monorepo/server ← Express API on port 4000, depends on shared
└── @monorepo/web  ← React 19 + Vite SPA on port 3000, depends on shared + ui
```

Internal packages use `workspace:*` protocol. The web app's Vite config resolves `@monorepo/shared` and `@monorepo/ui` to their `src/` directories for source-level imports during development.

### Key Configuration

- **turbo.json**: `build` depends on upstream `^build`, outputs cached to `dist/**`. `dev` and `clean` are uncached.
- **tsconfig.json** (root): ES2022 target, ESNext modules, bundler module resolution, strict mode. Uses project references chain: `shared → ui → web`, `shared → server`.
- **pnpm-workspace.yaml**: globs `apps/*` and `packages/*`.

### API Endpoints (server)

- `GET /api/health` — health check with timestamp
- `GET /api/users` — returns hardcoded user list
- Uses `@monorepo/shared`'s `createResponse()` for standardized JSON responses.
