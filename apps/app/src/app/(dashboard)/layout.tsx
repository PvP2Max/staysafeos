import { getLogtoContext, signOut } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { logtoConfig } from "@/lib/logto";
import { Button } from "@staysafeos/ui";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  if (!isAuthenticated) {
    redirect("/");
  }

  // TODO: Fetch actual role from membership
  const role = "DISPATCHER" as string; // Placeholder - will be fetched from API

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              StaySafeOS
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/rides">Rides</NavLink>
              <NavLink href="/dispatch">Dispatch</NavLink>
              <NavLink href="/vans">Vans</NavLink>
              <NavLink href="/drivers">Drivers</NavLink>
              {(role === "DRIVER" || role === "TC") && (
                <NavLink href="/driver">My Console</NavLink>
              )}
              <NavLink href="/training">Training</NavLink>
              <NavLink href="/shifts">Shifts</NavLink>
              {(role === "ADMIN" || role === "EXECUTIVE") && (
                <NavLink href="/admin">Admin</NavLink>
              )}
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

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </Link>
  );
}
