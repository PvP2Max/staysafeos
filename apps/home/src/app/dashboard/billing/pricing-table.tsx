"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from "@staysafeos/ui";

interface PricingTableProps {
  currentTier: string;
  organizationId: string;
  organizationName?: string;
}

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 99,
    description: "Perfect for small programs",
    features: [
      "1 active vehicle",
      "75 rides per month",
      "Basic export data",
      "Advanced export data",
      "Email support",
    ],
    limits: {
      vehicles: 1,
      rides: 75,
    },
  },
  {
    id: "growth",
    name: "Growth",
    price: 199,
    description: "For growing organizations",
    popular: true,
    features: [
      "2 active vehicles",
      "200 rides per month",
      "Custom branding",
      "Custom domain",
      "Emergency exports",
      "Discord community",
    ],
    limits: {
      vehicles: 2,
      rides: 200,
    },
  },
  {
    id: "pro",
    name: "Pro",
    price: 299,
    description: "Full-featured for large programs",
    features: [
      "3 active vehicles",
      "400 rides per month",
      "Custom homepage",
      "Training & role management",
      "Custom emergency procedures",
      "Personalized training videos",
      "SMS notifications",
      "Standard email support",
    ],
    limits: {
      vehicles: 3,
      rides: 400,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    description: "Everything, unlimited",
    features: [
      "5+ active vehicles",
      "Unlimited rides",
      "White-label branding",
      "Priority email support",
      "Dedicated account manager",
      "Site & user analytics",
      "App access (coming soon)",
    ],
    limits: {
      vehicles: 5,
      rides: "Unlimited",
    },
    contactSales: true,
  },
];

const tierOrder = ["free", "starter", "growth", "pro", "enterprise"];

export function PricingTable({ currentTier, organizationId, organizationName }: PricingTableProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const currentTierIndex = tierOrder.indexOf(currentTier);

  const getEnterpriseMailtoLink = () => {
    const subject = encodeURIComponent(`Enterprise Inquiry - ${organizationName || "My Organization"}`);
    const body = encodeURIComponent(
      `Organization: ${organizationName || "N/A"}\nOrganization ID: ${organizationId}\n\nI'm interested in learning more about StaySafeOS Enterprise pricing for our program.\n\nPlease tell us about your needs:\n- Number of vehicles:\n- Expected monthly rides:\n- Any special requirements:\n`
    );
    return `mailto:info@staysafeos.com?subject=${subject}&body=${body}`;
  };

  const handleSelectPlan = async (planId: string) => {
    setLoading(planId);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, organizationId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.message || "Failed to create checkout session");
      }
    } catch (error) {
      alert("Failed to create checkout session");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {plans.map((plan) => {
        const planIndex = tierOrder.indexOf(plan.id);
        const isCurrentPlan = plan.id === currentTier;
        const isDowngrade = planIndex < currentTierIndex;
        const isUpgrade = planIndex > currentTierIndex;

        return (
          <Card
            key={plan.id}
            className={`relative ${plan.popular ? "border-primary shadow-lg" : ""}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary">Most Popular</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {plan.name}
                {isCurrentPlan && (
                  <Badge variant="secondary">Current</Badge>
                )}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                {typeof plan.price === "number" ? (
                  <>
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </>
                ) : (
                  <span className="text-3xl font-bold">{plan.price}</span>
                )}
              </div>

              <ul className="space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {"contactSales" in plan && plan.contactSales ? (
                <Button
                  className="w-full"
                  variant={isCurrentPlan ? "outline" : "default"}
                  disabled={isCurrentPlan}
                  asChild={!isCurrentPlan}
                >
                  {isCurrentPlan ? (
                    <span>Current Plan</span>
                  ) : (
                    <a href={getEnterpriseMailtoLink()}>Contact Sales</a>
                  )}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant={isCurrentPlan ? "outline" : plan.popular ? "default" : "outline"}
                  disabled={isCurrentPlan || loading !== null}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {loading === plan.id
                    ? "Loading..."
                    : isCurrentPlan
                    ? "Current Plan"
                    : isDowngrade
                    ? "Downgrade"
                    : "Upgrade"}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
