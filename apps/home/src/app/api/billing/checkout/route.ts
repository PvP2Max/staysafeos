import { getLogtoContext } from "@logto/next/server-actions";
import { NextRequest, NextResponse } from "next/server";
import { getLogtoConfig } from "@/lib/logto";
import { stripe, PRICE_IDS } from "@/lib/stripe";

// Force runtime evaluation - env vars not available at build time on Render
export const dynamic = "force-dynamic";

// Helper to get env vars at request time
function getApiBaseUrl() {
  return process.env.API_URL || "https://api.staysafeos.com";
}
function getBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

export async function POST(request: NextRequest) {
  try {
    const { isAuthenticated, accessToken, claims } = await getLogtoContext(getLogtoConfig());

    if (!isAuthenticated) {
      return NextResponse.json(
        { message: "Please sign in to manage billing" },
        { status: 401 }
      );
    }

    const { planId, organizationId } = await request.json();

    if (!planId || !organizationId) {
      return NextResponse.json(
        { message: "Plan ID and organization ID are required" },
        { status: 400 }
      );
    }

    const priceId = PRICE_IDS[planId];
    if (!priceId) {
      return NextResponse.json(
        { message: "Invalid plan selected" },
        { status: 400 }
      );
    }

    // Get organization details from API to check for existing Stripe customer
    let stripeCustomerId: string | null = null;
    let organizationName = "Organization";

    if (accessToken) {
      try {
        const response = await fetch(`${getApiBaseUrl()}/v1/organizations/${organizationId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (response.ok) {
          const org = await response.json();
          stripeCustomerId = org.stripeCustomerId;
          organizationName = org.name;
        }
      } catch {
        // Continue without org details
      }
    }

    // Create or retrieve Stripe customer
    let customer: string;
    if (stripeCustomerId) {
      customer = stripeCustomerId;
    } else {
      const newCustomer = await stripe.customers.create({
        email: claims?.email as string,
        name: organizationName,
        metadata: {
          organizationId,
          logtoUserId: claims?.sub as string,
        },
      });
      customer = newCustomer.id;

      // Update organization with Stripe customer ID via API
      if (accessToken) {
        try {
          await fetch(`${getApiBaseUrl()}/v1/organizations/${organizationId}/stripe-customer`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ stripeCustomerId: customer }),
          });
        } catch {
          // Continue even if update fails - webhook will handle it
        }
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing?canceled=true`,
      metadata: {
        organizationId,
        planId,
      },
      subscription_data: {
        metadata: {
          organizationId,
          planId,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[api/billing/checkout] Error:", error);
    return NextResponse.json(
      { message: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
