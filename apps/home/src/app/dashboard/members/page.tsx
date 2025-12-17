import { createApiClient } from "@/lib/api/client";
import { MembersTable } from "./members-table";

export default async function MembersPage() {
  let members: Array<{
    id: string;
    accountId: string;
    role: string;
    active: boolean;
    account: { email: string; name?: string };
  }> = [];

  try {
    const api = await createApiClient();
    const result = await api.getMembers({ take: 100 });
    members = result.data;
  } catch {
    // Use empty list if API fails
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage your organization&apos;s users and their roles
          </p>
        </div>
      </div>

      <MembersTable members={members} />
    </div>
  );
}
