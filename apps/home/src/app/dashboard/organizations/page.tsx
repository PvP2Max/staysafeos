import { createApiClient } from "@/lib/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge } from "@staysafeos/ui";
import Link from "next/link";
import { CreateOrgDialog } from "./create-org-dialog";

export const metadata = {
  title: "Organizations | StaySafeOS",
  description: "Manage your organizations",
};

export default async function OrganizationsPage() {
  const api = await createApiClient();
  const me = await api.getMyOrganizations();

  const ownedOrgs = me.ownedTenants || [];
  const currentMembership = me.membership;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground mt-1">
            Manage your organizations and memberships
          </p>
        </div>
        <CreateOrgDialog />
      </div>

      {/* Owned Organizations */}
      <Card>
        <CardHeader>
          <CardTitle>Your Organizations</CardTitle>
          <CardDescription>
            Organizations you own and manage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ownedOrgs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>You don&apos;t own any organizations yet.</p>
              <CreateOrgDialog>
                <Button className="mt-4">Create Your First Organization</Button>
              </CreateOrgDialog>
            </div>
          ) : (
            <div className="space-y-4">
              {ownedOrgs.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{org.name}</h3>
                      <Badge variant="secondary">{org.subscriptionTier}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {org.slug}.staysafeos.com
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://${org.slug}.staysafeos.com`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        Visit App
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Membership */}
      {currentMembership && (
        <Card>
          <CardHeader>
            <CardTitle>Current Session</CardTitle>
            <CardDescription>
              Your active membership context
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Membership ID</p>
                <p className="font-mono text-sm">{currentMembership.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <Badge>{currentMembership.role}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Own multiple organizations?</strong> Each organization operates
            independently with its own team, vans, and riders.
          </p>
          <p>
            <strong>Want to join an organization?</strong> Ask the organization
            administrator to invite you, or use a support code if provided.
          </p>
          <Link href="/partners" className="text-primary hover:underline inline-block mt-2">
            Browse all partner organizations
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
