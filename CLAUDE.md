# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StaySafeOS is a multi-tenant SaaS platform for drunk driving prevention programs (SADD - Soldiers Against Drunk Driving). The platform manages ride requests, van dispatch, volunteer training, and operational coordination.

**This is a Turborepo monorepo** located at `/Users/kamronalexander/Documents/StaySafeOS/staysafeos/`.

## Monorepo Structure

```
staysafeos/
├── apps/
│   ├── api/          # @staysafeos/api - NestJS Core API
│   ├── app/          # @staysafeos/app - Operations Dashboard (tenant subdomains)
│   └── home/         # @staysafeos/home - Marketing & Control Plane
├── packages/
│   ├── ui/           # @staysafeos/ui - Shared React components
│   ├── theme/        # @staysafeos/theme - Tailwind preset & colors
│   ├── eslint-config/  # @staysafeos/eslint-config
│   └── typescript-config/  # @staysafeos/typescript-config
├── infra/            # Infrastructure configs (Logto setup docs)
├── render.yaml       # Render deployment blueprint
├── turbo.json        # Turborepo configuration
└── package.json      # Root workspace config
```

## Critical Development Rules

**DO NOT run dev servers** for App, Home, or API - these are Render services and are NOT run locally. Environment variables are configured in Render, not in local `.env` files.

**All commands should be run from the monorepo root** (`/Users/kamronalexander/Documents/StaySafeOS/staysafeos/`).

## Build & Common Commands

### From Monorepo Root
```bash
npm install               # Install all dependencies
npm run build             # Build all packages and apps (turbo)
npm run lint              # Lint all packages
npm run typecheck         # TypeScript check all packages
npm run clean             # Clean all build artifacts
```

### Build Specific Workspaces
```bash
npm run build -w @staysafeos/api     # Build API only
npm run build -w @staysafeos/home    # Build Home only
npm run build -w @staysafeos/app     # Build App only
npm run build -w @staysafeos/ui      # Build UI package
npm run build -w @staysafeos/theme   # Build Theme package
```

### API-Specific Commands (from apps/api/)
```bash
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Create migration (dev only)
npm run prisma:deploy     # Deploy migrations to database
npm run prisma:studio     # Open Prisma Studio
```

## Architecture

### Three Main Applications

| App | URL | Purpose |
|-----|-----|---------|
| **Home** | staysafeos.com | Marketing, signup, billing, org management |
| **App** | *.staysafeos.com | Tenant operations (dispatcher, driver, rides) |
| **API** | api.staysafeos.com | Centralized REST API |

### Multi-Tenancy
Every database query is scoped by `tenantId` via Prisma middleware. Tenant resolution uses:
- Subdomain parsing (e.g., `wainwright.staysafeos.com`)
- `X-StaySafe-Tenant` header
- JWT organization claims via AsyncLocalStorage context

### Authentication Flow (Logto)
1. **Logto** handles user identity (hosted at auth.staysafeos.com)
2. Home/App use `@logto/next` SDK for session management
3. API validates JWTs from Logto using JWKS
4. JIT (Just-In-Time) account provisioning creates Account records on first API access
5. Role-based access: `owner`, `admin`, `dispatcher`, `driver`, `safety`, `rider`

### Key API Modules (`apps/api/src/`)
- `auth/` - Logto JWT validation, guards, request context
- `accounts/` - Profile CRUD (`/v1/me` endpoints)
- `tenants/` - Organization management, features, members
- `rides/` - Ride request lifecycle
- `drivers/` - Driver console, shifts
- `vans/` - Fleet management
- `shifts/` - Shift scheduling
- `stream/` - Server-Sent Events (`/v1/stream`)
- `analytics/` - Dashboard metrics
- `training/` - Volunteer training modules
- `pages/` - CMS for tenant landing pages
- `theming/` - Per-tenant branding

### Shared Packages
- **@staysafeos/ui** - Button, Card, Badge, Dialog, Form components (shadcn/ui style)
- **@staysafeos/theme** - Tailwind preset, CSS variables, color system

## GitHub Repository

**Single monorepo:**
```
git@github.com:PvP2Max/staysafeos.git
```

SSH key: `~/.ssh/id_ed25519.pub`

## Infrastructure

### Render Services (render.yaml)
- **staysafeos-api** - NestJS API service
- **staysafeos-home** - Next.js marketing/control plane
- **staysafeos-app** - Next.js operations dashboard
- **staysafeos-db** - PostgreSQL (basic-256mb plan)

### External Services
- **Logto** - Auth server on DigitalOcean (auth.staysafeos.com)
- **Stripe** - Payment processing (configured in Home)

### Custom Domains
- `staysafeos.com` → staysafeos-home
- `api.staysafeos.com` → staysafeos-api
- `*.staysafeos.com` → staysafeos-app (wildcard for tenants)
- `auth.staysafeos.com` → Logto (DigitalOcean)

### Key Environment Variables
```
# All apps
LOGTO_ENDPOINT=https://auth.staysafeos.com
LOGTO_APP_ID=<from Logto console>
LOGTO_APP_SECRET=<from Logto console>
LOGTO_API_RESOURCE=https://api.staysafeos.com

# API only
LOGTO_AUDIENCE=https://api.staysafeos.com
DATABASE_URL=<Render PostgreSQL connection string>

# Home/App
API_URL=https://api.staysafeos.com
NEXT_PUBLIC_BASE_URL=<service URL>
```

## Tech Stack Summary

| Package | Framework | Key Dependencies |
|---------|-----------|------------------|
| @staysafeos/api | NestJS 11 + Fastify 5 | Prisma 6, jose (JWT) |
| @staysafeos/home | Next.js 15 + React 19 | @logto/next, Stripe |
| @staysafeos/app | Next.js 15 + React 19 | @logto/next |
| @staysafeos/ui | React 19 | Tailwind, Radix UI |
| @staysafeos/theme | Tailwind | CSS variables |

All packages use TypeScript 5.7+ strict mode and Tailwind CSS.

## Development Notes

### Server Components & Logto
In Next.js Server Components, you cannot call `getAccessToken()` directly (it modifies cookies). Instead:
1. Create an API route (e.g., `/api/me`) that fetches the token
2. Have Server Components call the internal API route with forwarded cookies

Example pattern used in `apps/home/src/app/dashboard/`:
```typescript
async function fetchData() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const cookie = headersList.get("cookie") || "";

  const response = await fetch(`${protocol}://${host}/api/me`, {
    headers: { cookie },
    cache: "no-store",
  });
  return response.json();
}
```

### Prisma in API
The Prisma schema is at `apps/api/prisma/schema.prisma`. To update the database:
1. Edit the schema
2. Run `npm run prisma:migrate -w @staysafeos/api` (creates migration)
3. Or use `npx prisma db push` on Render shell for quick schema sync
