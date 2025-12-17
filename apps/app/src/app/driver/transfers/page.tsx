"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from "@staysafeos/ui";
import Link from "next/link";

interface Transfer {
  id: string;
  status: string;
  van?: { name: string };
  fromMembership?: { account?: { name?: string } };
  toMembership?: { account?: { name?: string } };
  createdAt: string;
}

export default function TransfersPage() {
  const [isPending, startTransition] = useTransition();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Fetch transfers on mount
    fetch("/api/driver/transfers")
      .then((res) => res.json())
      .then((data) => setTransfers(data))
      .catch(() => {});
  }, []);

  const handleAccept = (transferId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/driver/transfers/${transferId}/accept`, {
          method: "POST",
        });

        if (!response.ok) throw new Error("Failed to accept transfer");

        setTransfers((prev) =>
          prev.map((t) => (t.id === transferId ? { ...t, status: "ACCEPTED" } : t))
        );
        setMessage("Transfer accepted!");
      } catch {
        setMessage("Failed to accept transfer.");
      }
    });
  };

  const handleDecline = (transferId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/driver/transfers/${transferId}/decline`, {
          method: "POST",
        });

        if (!response.ok) throw new Error("Failed to decline transfer");

        setTransfers((prev) =>
          prev.map((t) => (t.id === transferId ? { ...t, status: "DECLINED" } : t))
        );
        setMessage("Transfer declined.");
      } catch {
        setMessage("Failed to decline transfer.");
      }
    });
  };

  const pendingTransfers = transfers.filter((t) => t.status === "PENDING");
  const pastTransfers = transfers.filter((t) => t.status !== "PENDING");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/driver" className="text-xl font-bold text-primary">
            &larr; Back
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-lg">
        <div>
          <h1 className="text-2xl font-bold">TC Transfers</h1>
          <p className="text-muted-foreground mt-1">Manage transfer requests</p>
        </div>

        {message && (
          <p className={`text-sm ${message.includes("Failed") ? "text-red-600" : "text-green-600"}`}>
            {message}
          </p>
        )}

        {/* Pending Transfers */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
            <CardDescription>Transfers waiting for your response</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingTransfers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No pending transfers</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTransfers.map((transfer) => (
                  <div key={transfer.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {transfer.fromMembership?.account?.name || "Unknown"} wants to transfer
                        </p>
                        {transfer.van && (
                          <p className="text-sm text-muted-foreground">
                            Van: {transfer.van.name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(transfer.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => handleAccept(transfer.id)}
                        disabled={isPending}
                        className="flex-1"
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDecline(transfer.id)}
                        disabled={isPending}
                        className="flex-1"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Transfers */}
        {pastTransfers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Transfer History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pastTransfers.map((transfer) => (
                  <div
                    key={transfer.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="text-sm">
                        {transfer.fromMembership?.account?.name || "Unknown"} → {" "}
                        {transfer.toMembership?.account?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transfer.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      className={
                        transfer.status === "ACCEPTED"
                          ? "bg-green-100 text-green-800"
                          : transfer.status === "DECLINED"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                      }
                    >
                      {transfer.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
