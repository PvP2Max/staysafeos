import { NextResponse } from "next/server";

/**
 * Domain verification endpoint for custom domains
 * This endpoint is used by the API to verify that a custom domain
 * is correctly pointing to the StaySafeOS app server.
 *
 * When Cloudflare proxy is ON, CNAME records are flattened and cannot
 * be verified via DNS lookups. This HTTP endpoint provides an alternative
 * verification method - if a request to this endpoint succeeds, it means
 * the domain is correctly configured to route traffic to our servers.
 */
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "x-staysafeos-server": "true",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET() {
  return NextResponse.json(
    {
      verified: true,
      server: "staysafeos-app",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "x-staysafeos-server": "true",
        "Cache-Control": "no-store",
      },
    }
  );
}
