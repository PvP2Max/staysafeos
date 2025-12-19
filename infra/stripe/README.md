# Stripe Billing Integration

This guide covers setting up Stripe for subscription billing in StaySafeOS.

## Overview

StaySafeOS uses Stripe for:
- Subscription management (Free, Starter, Professional, Enterprise tiers)
- Checkout sessions for plan upgrades
- Webhooks for real-time subscription status updates

## URLs

| Environment | Webhook URL |
|-------------|-------------|
| Production | `https://staysafeos.com/api/billing/webhook` |

## Prerequisites

- Stripe account (https://stripe.com)
- Access to Stripe Dashboard

## Step 1: Create Products & Prices

In Stripe Dashboard → Products:

### 1. Starter Plan
- **Name:** Starter
- **Price:** $29/month (recurring)
- Note the **Price ID** (starts with `price_`)

### 2. Professional Plan
- **Name:** Professional
- **Price:** $99/month (recurring)
- Note the **Price ID** (starts with `price_`)

### 3. Enterprise Plan
- **Name:** Enterprise
- **Price:** Custom pricing (contact sales)
- Create a placeholder price or leave for manual invoicing

**Important:** You need the **Price ID** (e.g., `price_1ABC123`), NOT the Product ID (e.g., `prod_XYZ789`). Price IDs always start with `price_`.

## Step 2: Create Webhook Endpoint

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter:
   - **Endpoint URL:** `https://staysafeos.com/api/billing/webhook`
   - **Description:** StaySafeOS subscription events
4. Select events to listen to:

### Required Events

| Event | Purpose |
|-------|---------|
| `checkout.session.completed` | Handles successful checkout, activates subscription |
| `customer.subscription.created` | New subscription created |
| `customer.subscription.updated` | Subscription plan or status changed |
| `customer.subscription.deleted` | Subscription cancelled/expired |
| `invoice.payment_failed` | Payment failed, marks subscription as past_due |

5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_`)

## Step 3: Set Environment Variables

In Render Dashboard for **staysafeos-home**:

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
```

**For testing:** Use `sk_test_` keys and test webhook secret.

## Step 4: Internal API Key (Optional)

For webhook-to-API communication, set an internal API key:

In **staysafeos-home**:
```
INTERNAL_API_KEY=<random-secure-string>
```

In **staysafeos-api**:
```
INTERNAL_API_KEY=<same-random-secure-string>
```

Generate with: `openssl rand -base64 32`

## How It Works

### Checkout Flow

1. User clicks "Upgrade" on billing page
2. Home app creates Stripe Checkout Session with metadata:
   ```json
   {
     "organizationId": "org_123",
     "planId": "professional"
   }
   ```
3. User completes payment on Stripe
4. Stripe sends `checkout.session.completed` webhook
5. Webhook handler updates organization's subscription tier

### Subscription Updates

When subscription status changes:
1. Stripe sends webhook event
2. Handler extracts `organizationId` from subscription metadata
3. Calls internal API to update organization record

### Webhook Handler

Located at: `apps/home/src/app/api/billing/webhook/route.ts`

Events handled:
- **checkout.session.completed** → Activates subscription, stores customer/subscription IDs
- **customer.subscription.updated** → Updates tier and status
- **customer.subscription.deleted** → Downgrades to free tier
- **invoice.payment_failed** → Marks as past_due

## Testing Webhooks Locally

Use Stripe CLI to forward events:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local (if running dev server)
stripe listen --forward-to localhost:3000/api/billing/webhook

# Copy the webhook signing secret from output
```

## Pricing Tiers

| Tier | Monthly | Features |
|------|---------|----------|
| Free | $0 | Basic features, limited usage |
| Starter | $29 | Core features, email support |
| Professional | $99 | All features, priority support |
| Enterprise | Custom | Custom pricing, dedicated support |

Enterprise customers contact sales at info@staysafeos.com.

## Troubleshooting

### "No such price" Error

You're using a **Product ID** instead of a **Price ID**.
- Wrong: `prod_ABC123`
- Correct: `price_ABC123`

Check your env vars: `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID`

### Webhook Signature Failed

1. Verify `STRIPE_WEBHOOK_SECRET` matches the signing secret in Stripe Dashboard
2. Ensure webhook URL is exactly `https://staysafeos.com/api/billing/webhook`
3. Check that the secret starts with `whsec_`

### Subscription Not Updating

1. Check webhook logs in Stripe Dashboard → Developers → Webhooks → [endpoint] → Logs
2. Verify `organizationId` is in subscription metadata
3. Check API logs for errors updating organization

### Missing Metadata

If subscription metadata is missing `organizationId`:
- Ensure checkout session includes metadata when created
- Check `apps/home/src/app/api/billing/checkout/route.ts`

## Dashboard Links

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Products](https://dashboard.stripe.com/products)
- [Webhooks](https://dashboard.stripe.com/webhooks)
- [Event Logs](https://dashboard.stripe.com/events)
- [API Keys](https://dashboard.stripe.com/apikeys)

## Cost

- **Stripe fees:** 2.9% + $0.30 per transaction
- **No monthly fee** for basic Stripe usage
