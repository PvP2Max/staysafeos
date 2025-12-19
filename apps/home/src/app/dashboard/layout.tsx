import { getLogtoContext } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { logtoConfig } from "@/lib/logto";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { OrgSwitcher } from "@/components/org-switcher";

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
            <Link href="/dashboard">
              <Logo size="md" />
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/dashboard/organizations" className="text-muted-foreground hover:text-foreground">
                Organizations
              </Link>
              <Link href="/dashboard/branding" className="text-muted-foreground hover:text-foreground">
                Branding
              </Link>
              <Link href="/dashboard/pages" className="text-muted-foreground hover:text-foreground">
                Pages
              </Link>
              <Link href="/dashboard/domains" className="text-muted-foreground hover:text-foreground">
                Domains
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <OrgSwitcher />
            <ProfileDropdown
              name={claims?.name as string | undefined}
              email={claims?.email as string | undefined}
              avatarUrl={claims?.picture as string | undefined}
            />
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
