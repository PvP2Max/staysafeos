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
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Dashboard Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              StaySafeOS
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/dashboard/branding" className="text-muted-foreground hover:text-foreground">
                Branding
              </Link>
              <Link href="/dashboard/pages" className="text-muted-foreground hover:text-foreground">
                Pages
              </Link>
              <Link href="/dashboard/settings" className="text-muted-foreground hover:text-foreground">
                Settings
              </Link>
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

      {/* Dashboard Content */}
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
