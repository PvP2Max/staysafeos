import { getLogtoContext } from "@logto/next/server-actions";
import { NextRequest, NextResponse } from "next/server";
import { getLogtoConfig, getApiAccessToken } from "@/lib/logto";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

function getApiBaseUrl() {
  return process.env.API_URL || "https://api.staysafeos.com";
}

export async function GET(request: NextRequest) {
  try {
    const { isAuthenticated } = await getLogtoContext(getLogtoConfig());

    if (!isAuthenticated) {
      return NextResponse.json(
        { message: "Please sign in to view billing" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { message: "Organization ID is required" },
        { status: 400 }
      );
    }

    const accessToken = await getApiAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { message: "Unable to get API access" },
        { status: 401 }
      );
    }

    // Get organization details from API
    const response = await fetch(`${getApiBaseUrl()}/v1/organizations/${organizationId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "Organization not found" },
        { status: 404 }
      );
    }

    const org = await response.json();

    if (!org.stripeSubscriptionId) {
      return NextResponse.json({
        hasSubscription: false,
        tier: org.subscriptionTier || "free",
      });
    }

    // Fetch subscription details from Stripe
    const stripe = getStripe();
    const subscriptionResponse = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);

    // In Stripe SDK v20+, the response may be wrapped - extract the subscription data
    const subscription = subscriptionResponse as unknown as Stripe.Subscription;

    if (!subscription || subscription.status === "canceled") {
      return NextResponse.json({
        hasSubscription: false,
        tier: org.subscriptionTier || "free",
      });
    }

    // Get the price details from the first line item
    const lineItem = subscription.items.data[0];
    const price = lineItem?.price;

    return NextResponse.json({
      hasSubscription: true,
      tier: org.subscriptionTier || "free",
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: lineItem?.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      price: price
        ? {
            amount: (price.unit_amount || 0) / 100,
            currency: price.currency,
            interval: price.recurring?.interval || "month",
          }
        : null,
    });
  } catch (error) {
    console.error("[api/billing/subscription] Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch subscription details" },
      { status: 500 }
    );
  }
}
