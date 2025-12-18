import { getLogtoContext } from "@logto/next/server-actions";
import { NextRequest, NextResponse } from "next/server";
import { getLogtoConfig } from "@/lib/logto";
import { stripe } from "@/lib/stripe";

// Force runtime evaluation - env vars not available at build time on Render
export const dynamic = "force-dynamic";

// Helper to get API URL at request time
function getApiBaseUrl() {
  return process.env.API_URL || "https://api.staysafeos.com";
}

export async function POST(request: NextRequest) {
  try {
    const { isAuthenticated, accessToken } = await getLogtoContext(getLogtoConfig());

    if (!isAuthenticated) {
      return NextResponse.json(
        { message: "Please sign in to manage billing" },
        { status: 401 }
      );
    }

    const { organizationId } = await request.json();

    if (!organizationId) {
      return NextResponse.json(
        { message: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Get organization's Stripe customer ID from API
    let stripeCustomerId: string | null = null;

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
        }
      } catch {
        // Continue without org details
      }
    }

    if (!stripeCustomerId) {
      return NextResponse.json(
        { message: "No billing account found for this organization" },
        { status: 404 }
      );
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[api/billing/portal] Error:", error);
    return NextResponse.json(
      { message: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
