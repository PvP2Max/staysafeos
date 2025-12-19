# StaySafeOS v2

Multi-tenant SaaS platform for drunk driving prevention programs (SADD - Soldiers Against Drunk Driving).

## Architecture

```
staysafeos/
├── apps/
│   ├── api/          # NestJS + Fastify - Core API
│   ├── home/         # Next.js - Marketing & Control Plane
│   └── app/          # Next.js - Operations Dashboard
├── packages/
│   ├── theme/        # @staysafeos/theme - Color palette generation
│   ├── ui/           # @staysafeos/ui - ShadCN components
│   ├── eslint-config/
│   └── typescript-config/
├── mobile/           # Expo - Driver/Rider apps (separate deployment)
└── infra/            # Infrastructure configs
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| API | NestJS 11 + Fastify + Prisma 6 |
| Frontend | Next.js 15 + React 19 |
| UI | ShadCN + Tailwind CSS |
| Auth | Logto (self-hosted) |
| Database | PostgreSQL |
| Hosting | Render |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL database
- Logto instance (self-hosted or cloud)

### Installation

```bash
# Install dependencies
npm install

# Build shared packages
npm run build --filter=@staysafeos/theme --filter=@staysafeos/ui

# Set up environment variables
# Copy .env.example to .env.local in each app directory
```

### Development

**Note:** For production deployments on Render, do NOT run dev servers locally.

```bash
# Build all packages
npm run build

# Run API locally (if needed for testing)
npm run dev --filter=@staysafeos/api

# Run Home locally
npm run dev --filter=@staysafeos/home

# Run App locally
npm run dev --filter=@staysafeos/app
```

## Deployment

This monorepo is designed for deployment on Render. Each app deploys from its subdirectory:

- API: `apps/api` → api.staysafeos.com
- Home: `apps/home` → home.staysafeos.com
- App: `apps/app` → app.staysafeos.com

See `render.yaml` for the complete deployment configuration.

### Logto Setup

1. Deploy Logto OSS or use Logto Cloud
2. Create web applications for Home and App
3. Configure callback URLs:
   - Home: `https://home.staysafeos.com/callback`
   - App: `https://app.staysafeos.com/callback`
4. Create API resource: `https://api.staysafeos.com`
5. Enable Organizations feature for multi-tenancy

## Theming

The platform supports white-labeling through the `@staysafeos/theme` package:

```typescript
import { generatePalette, injectTheme } from "@staysafeos/theme";

// Generate full color palette from a single primary color
const theme = generatePalette("#3B82F6");

// Inject theme at runtime
injectTheme({ primaryColor: "#3B82F6" });
```

## Multi-Tenancy

Each tenant (organization) maps to a Logto Organization. Tenants can:

- Customize their branding (colors, logo, favicon)
- Edit their pages using the block-based editor
- Manage their own members and roles

## Organization Management

Organizations are managed from the Dashboard → Organizations page:

### Features per Organization
- **Settings Dialog** - Toggle features (Ride Requests, Walk-Ons, TC Transfers, Training, Shifts, Analytics, Support Codes)
- **Delete Dialog** - Permanently delete organization with confirmation (requires typing org name)

### Stats Archival
When an organization is deleted, aggregate statistics are preserved in the `GlobalStats` table for marketing purposes:
- Total rides completed
- Total volunteers trained
- Total organizations served
- Total vans registered

The marketing page at staysafeos.com displays these stats dynamically.

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/organizations/:id/features` | GET | Get organization feature toggles |
| `/v1/organizations/:id/features` | PATCH | Update feature toggles |
| `/v1/organizations/:id` | DELETE | Archive stats and delete organization |
| `/v1/global-stats` | GET | Public endpoint for marketing stats |

## Billing

Subscription billing is handled via Stripe with three paid tiers:

| Tier | Price | Features |
|------|-------|----------|
| Free | $0/mo | Basic features |
| Starter | $29/mo | Core features, email support |
| Professional | $99/mo | All features, priority support |
| Enterprise | Custom | Contact sales |

Enterprise pricing is custom per organization - contact info@staysafeos.com.

See [infra/stripe/README.md](infra/stripe/README.md) for Stripe setup and webhook configuration.

## Infrastructure Docs

- [Logto Setup](infra/logto/README.md) - Self-hosted auth server on DigitalOcean
- [Stripe Setup](infra/stripe/README.md) - Billing and webhook configuration

## License

MIT
