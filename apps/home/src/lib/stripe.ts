import Stripe from "stripe";

// Lazy initialization of Stripe client
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(secretKey, {
      typescript: true,
    });
  }
  return _stripe;
}

// For backwards compatibility
export const stripe = {
  get customers() { return getStripe().customers; },
  get checkout() { return getStripe().checkout; },
  get billingPortal() { return getStripe().billingPortal; },
  get webhooks() { return getStripe().webhooks; },
  get subscriptions() { return getStripe().subscriptions; },
};

// Price IDs for each plan - uses getter to read env vars at runtime
export const PRICE_IDS: Record<string, string> = new Proxy({} as Record<string, string>, {
  get(_, planId: string) {
    const priceMap: Record<string, string | undefined> = {
      starter: process.env.STRIPE_PRICE_STARTER,
      growth: process.env.STRIPE_PRICE_GROWTH,
      pro: process.env.STRIPE_PRICE_PRO,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
    };
    return priceMap[planId] || "";
  },
});

// Plan limits for feature gating
export const PLAN_LIMITS: Record<string, { vehicles: number; rides: number | null; features: string[] }> = {
  free: {
    vehicles: 0,
    rides: 10,
    features: [],
  },
  starter: {
    vehicles: 1,
    rides: 75,
    features: ["basic_export", "advanced_export"],
  },
  growth: {
    vehicles: 2,
    rides: 200,
    features: ["basic_export", "advanced_export", "emergency_export", "custom_branding", "custom_domain", "discord"],
  },
  pro: {
    vehicles: 3,
    rides: 400,
    features: [
      "basic_export",
      "advanced_export",
      "emergency_export",
      "custom_branding",
      "custom_domain",
      "custom_homepage",
      "training",
      "custom_emergency",
      "personalized_training",
      "sms",
      "discord",
      "email_support",
    ],
  },
  enterprise: {
    vehicles: 5,
    rides: null, // unlimited
    features: [
      "basic_export",
      "advanced_export",
      "emergency_export",
      "custom_branding",
      "custom_domain",
      "custom_homepage",
      "training",
      "custom_emergency",
      "personalized_training",
      "sms",
      "discord",
      "email_support",
      "priority_support",
      "dedicated_manager",
      "site_analytics",
      "user_analytics",
      "white_label",
      "app_access",
    ],
  },
};
