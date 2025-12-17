import { getLogtoContext } from "@logto/next/server-actions";
import { logtoConfig } from "@/lib/logto";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@staysafeos/ui";
import Link from "next/link";

export default async function DashboardPage() {
  const { claims } = await getLogtoContext(logtoConfig);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {claims?.name || claims?.email || "User"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your organization&apos;s StaySafeOS settings
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <QuickActionCard
          href="/dashboard/branding"
          title="Customize Branding"
          description="Update your logo, colors, and favicon"
        />
        <QuickActionCard
          href="/dashboard/pages"
          title="Edit Pages"
          description="Customize your home page and content"
        />
        <QuickActionCard
          href="/dashboard/settings"
          title="Settings"
          description="Manage organization settings"
        />
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <StatCard title="Total Rides" value="0" description="This month" />
        <StatCard title="Active Drivers" value="0" description="Currently online" />
        <StatCard title="Volunteers" value="0" description="Registered" />
        <StatCard title="Vans" value="0" description="In fleet" />
      </div>
    </div>
  );
}

function QuickActionCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary transition-colors cursor-pointer">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-4xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
