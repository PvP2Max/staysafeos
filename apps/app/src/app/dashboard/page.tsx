import { getLogtoContext, signOut } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { logtoConfig } from "@/lib/logto";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@staysafeos/ui";

export default async function DashboardPage() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated) {
    redirect("/");
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <span className="text-xl font-bold text-primary">StaySafeOS Dispatch</span>
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <a href="/dashboard" className="text-foreground font-medium">Dashboard</a>
              <a href="/dashboard/rides" className="text-muted-foreground hover:text-foreground">Rides</a>
              <a href="/dashboard/dispatch" className="text-muted-foreground hover:text-foreground">Dispatch</a>
              <a href="/dashboard/drivers" className="text-muted-foreground hover:text-foreground">Drivers</a>
              <a href="/dashboard/vans" className="text-muted-foreground hover:text-foreground">Vans</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {claims?.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut(logtoConfig);
              }}
            >
              <Button variant="ghost" size="sm" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Operations Dashboard</h1>
            <p className="text-muted-foreground mt-1">Real-time ride management and dispatch</p>
          </div>

          {/* Stats */}
          <div className="grid gap-6 md:grid-cols-4">
            <StatCard title="Pending Rides" value="0" variant="warning" />
            <StatCard title="Active Rides" value="0" variant="primary" />
            <StatCard title="Online Drivers" value="0" variant="success" />
            <StatCard title="Completed Today" value="0" variant="default" />
          </div>

          {/* Ride Queue Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Ride Queue</CardTitle>
              <CardDescription>Pending ride requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <p>No pending rides</p>
                <p className="text-sm mt-1">New ride requests will appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  variant = "default",
}: {
  title: string;
  value: string;
  variant?: "default" | "primary" | "success" | "warning";
}) {
  const variantClasses = {
    default: "bg-card",
    primary: "bg-primary/10 border-primary/20",
    success: "bg-green-500/10 border-green-500/20",
    warning: "bg-yellow-500/10 border-yellow-500/20",
  };

  return (
    <Card className={variantClasses[variant]}>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-4xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
