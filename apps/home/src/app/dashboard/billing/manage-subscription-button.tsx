"use client";

import { useState } from "react";
import { Button } from "@staysafeos/ui";

interface ManageSubscriptionButtonProps {
  organizationId: string;
}

export function ManageSubscriptionButton({ organizationId }: ManageSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleManage = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.message || "Failed to open billing portal");
      }
    } catch (error) {
      alert("Failed to open billing portal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleManage} disabled={loading}>
      {loading ? "Loading..." : "Manage Subscription"}
    </Button>
  );
}
