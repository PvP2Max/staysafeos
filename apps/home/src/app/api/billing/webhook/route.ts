import { NextRequest, NextResponse } from "next/server";
import { getStripe, stripe } from "@/lib/stripe";
import Stripe from "stripe";

// Force runtime evaluation - env vars not available at build time on Render
export const dynamic = "force-dynamic";

// Helpers to get env vars at request time
function getApiBaseUrl() {
  return process.env.API_URL || "https://api.staysafeos.com";
}
function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET!;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ message: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, getWebhookSecret());
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhook] Error handling event:", error);
    return NextResponse.json(
      { message: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organizationId;
  const planId = session.metadata?.planId;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!organizationId || !planId) {
    console.error("[webhook] Missing metadata in checkout session");
    return;
  }

  // Update organization with subscription details via internal API
  await updateOrganizationSubscription(organizationId, {
    subscriptionTier: planId,
    subscriptionStatus: "active",
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
  });

  console.log(`[webhook] Checkout completed for org ${organizationId}, plan: ${planId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organizationId;
  const planId = subscription.metadata?.planId;

  if (!organizationId) {
    // Try to find org by customer ID
    console.log("[webhook] No organizationId in subscription metadata, skipping");
    return;
  }

  const status = subscription.status === "active" ? "active" : subscription.status;

  await updateOrganizationSubscription(organizationId, {
    subscriptionTier: planId || undefined,
    subscriptionStatus: status,
    stripeSubscriptionId: subscription.id,
  });

  console.log(`[webhook] Subscription updated for org ${organizationId}, status: ${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organizationId;

  if (!organizationId) {
    console.log("[webhook] No organizationId in subscription metadata, skipping");
    return;
  }

  // Downgrade to free tier
  await updateOrganizationSubscription(organizationId, {
    subscriptionTier: "free",
    subscriptionStatus: "canceled",
    stripeSubscriptionId: null,
  });

  console.log(`[webhook] Subscription deleted for org ${organizationId}, downgraded to free`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Get subscription ID from invoice lines or parent
  const subscriptionId =
    (invoice as unknown as { subscription?: string }).subscription ||
    invoice.lines?.data?.[0]?.subscription;

  if (!subscriptionId || typeof subscriptionId !== "string") return;

  // Get subscription to find organization
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const organizationId = subscription.metadata?.organizationId;

  if (!organizationId) return;

  await updateOrganizationSubscription(organizationId, {
    subscriptionStatus: "past_due",
  });

  console.log(`[webhook] Payment failed for org ${organizationId}`);
}

async function updateOrganizationSubscription(
  organizationId: string,
  data: {
    subscriptionTier?: string;
    subscriptionStatus?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string | null;
  }
) {
  // Use internal API key for webhook updates
  const internalApiKey = process.env.INTERNAL_API_KEY;

  try {
    const response = await fetch(
      `${getApiBaseUrl()}/v1/internal/organizations/${organizationId}/subscription`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(internalApiKey ? { "X-Internal-Key": internalApiKey } : {}),
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      console.error(`[webhook] Failed to update org ${organizationId}:`, await response.text());
    }
  } catch (error) {
    console.error(`[webhook] Error updating org ${organizationId}:`, error);
  }
}
