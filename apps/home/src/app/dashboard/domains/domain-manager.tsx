"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@staysafeos/ui";
import {
  addDomain,
  verifyDomain,
  setPrimaryDomain,
  deleteDomain,
} from "@/lib/api/actions";

interface DnsRecord {
  type: string;
  name: string;
  value: string;
  status: "pending" | "verified" | "error";
}

interface Domain {
  id: string;
  domain: string;
  isPrimary: boolean;
  verifiedAt: string | null;
  sslProvisioned: boolean;
  createdAt: string;
  dnsRecords: DnsRecord[];
}

interface DomainManagerProps {
  domains: Domain[];
  canAddDomains: boolean;
}

export function DomainManager({ domains: initialDomains, canAddDomains }: DomainManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [domains, setDomains] = useState(initialDomains);
  const [isAdding, setIsAdding] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [deletingDomain, setDeletingDomain] = useState<Domain | null>(null);
  const [message, setMessage] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleAddDomain = () => {
    if (!newDomain.trim()) return;

    startTransition(async () => {
      try {
        const result = await addDomain(newDomain.trim().toLowerCase());
        setDomains([result, ...domains]);
        setIsAdding(false);
        setNewDomain("");
        setMessage("Domain added! Configure DNS records below.");
        setExpandedDomain(result.id);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Failed to add domain"
        );
      }
    });
  };

  const handleVerify = (id: string) => {
    startTransition(async () => {
      const result = await verifyDomain(id);
      if (result.success && result.data) {
        setDomains(
          domains.map((d) =>
            d.id === id ? (result.data as Domain) : d
          )
        );
        setMessage("Domain verified successfully!");
      } else {
        setMessage(result.error || "Verification failed. Check your DNS records.");
      }
    });
  };

  const handleSetPrimary = (id: string) => {
    startTransition(async () => {
      try {
        await setPrimaryDomain(id);
        setDomains(
          domains.map((d) => ({
            ...d,
            isPrimary: d.id === id,
          }))
        );
        setMessage("Primary domain updated!");
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Failed to set primary"
        );
      }
    });
  };

  const handleDelete = () => {
    if (!deletingDomain) return;

    startTransition(async () => {
      try {
        await deleteDomain(deletingDomain.id);
        setDomains(domains.filter((d) => d.id !== deletingDomain.id));
        setDeletingDomain(null);
        setMessage("Domain removed successfully!");
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Failed to delete domain"
        );
      }
    });
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          {!canAddDomains && (
            <p className="text-sm text-muted-foreground">
              Custom domains require Pro or Enterprise subscription.
            </p>
          )}
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          disabled={!canAddDomains}
        >
          Add Domain
        </Button>
      </div>

      {message && (
        <p
          className={`text-sm ${
            message.includes("success") ||
            message.includes("verified") ||
            message.includes("updated") ||
            message.includes("added")
              ? "text-green-600"
              : "text-amber-600"
          }`}
        >
          {message}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Custom Domains ({domains.length})</CardTitle>
          <CardDescription>
            Connect your own domain to your StaySafeOS site
          </CardDescription>
        </CardHeader>
        <CardContent>
          {domains.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No custom domains configured. Add a domain to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4 bg-card">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{domain.domain}</p>
                          {domain.isPrimary && (
                            <Badge variant="default">Primary</Badge>
                          )}
                          <Badge
                            variant={domain.verifiedAt ? "default" : "secondary"}
                            className={
                              domain.verifiedAt
                                ? "bg-green-100 text-green-800"
                                : ""
                            }
                          >
                            {domain.verifiedAt ? "Verified" : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Added{" "}
                          {new Date(domain.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!domain.verifiedAt && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleVerify(domain.id)}
                          disabled={isPending}
                        >
                          Verify DNS
                        </Button>
                      )}
                      {domain.verifiedAt && !domain.isPrimary && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetPrimary(domain.id)}
                          disabled={isPending}
                        >
                          Set Primary
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedDomain(
                            expandedDomain === domain.id ? null : domain.id
                          )
                        }
                      >
                        {expandedDomain === domain.id
                          ? "Hide DNS"
                          : "Show DNS"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeletingDomain(domain)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>

                  {/* DNS Records Section */}
                  {expandedDomain === domain.id && (
                    <div className="border-t bg-muted/30 p-4">
                      <p className="text-sm font-medium mb-3">
                        Configure these DNS records with your domain provider:
                      </p>
                      <div className="space-y-3">
                        {domain.dnsRecords.map((record, idx) => (
                          <div
                            key={idx}
                            className="bg-background border rounded p-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">{record.type}</Badge>
                              <Badge
                                variant={
                                  record.status === "verified"
                                    ? "default"
                                    : "secondary"
                                }
                                className={
                                  record.status === "verified"
                                    ? "bg-green-100 text-green-800"
                                    : ""
                                }
                              >
                                {record.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground mb-1">Name</p>
                                <div className="flex items-center gap-2">
                                  <p className="font-mono bg-muted px-2 py-1 rounded break-all flex-1">
                                    {record.name}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 shrink-0"
                                    onClick={() => copyToClipboard(record.name, `${domain.id}-name-${idx}`)}
                                  >
                                    {copiedField === `${domain.id}-name-${idx}` ? (
                                      <CheckIcon className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <CopyIcon className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Value</p>
                                <div className="flex items-center gap-2">
                                  <p className="font-mono bg-muted px-2 py-1 rounded break-all flex-1">
                                    {record.value}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 shrink-0"
                                    onClick={() => copyToClipboard(record.value, `${domain.id}-value-${idx}`)}
                                  >
                                    {copiedField === `${domain.id}-value-${idx}` ? (
                                      <CheckIcon className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <CopyIcon className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        DNS changes can take up to 48 hours to propagate. Click
                        &quot;Verify DNS&quot; after configuring your records.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Domain Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Domain</DialogTitle>
            <DialogDescription>
              Enter your domain name. You&apos;ll need to configure DNS records
              after adding it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                placeholder="rides.example.com"
                value={newDomain}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewDomain(e.target.value)
                }
              />
              <p className="text-xs text-muted-foreground">
                Enter the full domain (e.g., rides.example.com or
                saferide.university.edu)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddDomain}
              disabled={isPending || !newDomain.trim()}
            >
              {isPending ? "Adding..." : "Add Domain"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingDomain}
        onOpenChange={() => setDeletingDomain(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Domain</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <strong>{deletingDomain?.domain}</strong>? This will disconnect
              the domain from your site.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingDomain(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
