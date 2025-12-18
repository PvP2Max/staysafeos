import Link from "next/link";
import { Button } from "@staysafeos/ui";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Documentation | StaySafeOS",
  description: "StaySafeOS documentation - Guides, tutorials, and API reference for drunk driving prevention programs.",
};

const docCategories = [
  {
    title: "Getting Started",
    description: "New to StaySafeOS? Start here to set up your organization.",
    icon: <RocketIcon />,
    docs: [
      { title: "Quick Start Guide", description: "Get your safe ride program up and running in 15 minutes" },
      { title: "Creating Your Organization", description: "Set up your organization, branding, and service area" },
      { title: "Inviting Team Members", description: "Add volunteers, drivers, and administrators" },
    ],
  },
  {
    title: "Dispatch & Operations",
    description: "Learn how to manage rides and coordinate your team.",
    icon: <DispatchIcon />,
    docs: [
      { title: "Dispatcher Dashboard", description: "Overview of the real-time dispatch interface" },
      { title: "Managing Ride Requests", description: "Accept, assign, and track rides" },
      { title: "Driver Console", description: "How drivers use the mobile app" },
    ],
  },
  {
    title: "Volunteer Management",
    description: "Tools for onboarding and managing your volunteers.",
    icon: <UsersIcon />,
    docs: [
      { title: "Volunteer Onboarding", description: "Training workflows and certification tracking" },
      { title: "Scheduling Shifts", description: "Manage volunteer availability and shifts" },
      { title: "Roles & Permissions", description: "Understanding user roles and access levels" },
    ],
  },
  {
    title: "Fleet & Vehicles",
    description: "Manage your vehicles and track maintenance.",
    icon: <VehicleIcon />,
    docs: [
      { title: "Adding Vehicles", description: "Register and configure your fleet" },
      { title: "Vehicle Tracking", description: "Real-time GPS tracking and status" },
      { title: "Maintenance Logs", description: "Track maintenance and inspections" },
    ],
  },
  {
    title: "Billing & Subscriptions",
    description: "Manage your plan and payment settings.",
    icon: <CardIcon />,
    docs: [
      { title: "Subscription Plans", description: "Compare features across pricing tiers" },
      { title: "Managing Billing", description: "Update payment methods and view invoices" },
      { title: "SMS Credits", description: "Understanding and purchasing SMS credits" },
    ],
  },
  {
    title: "Customization",
    description: "Brand StaySafeOS as your own.",
    icon: <PaletteIcon />,
    docs: [
      { title: "Branding & Theming", description: "Customize colors, logos, and appearance" },
      { title: "Custom Domains", description: "Set up your own domain (Growth+ plans)" },
      { title: "Service Area Setup", description: "Define your coverage boundaries" },
    ],
  },
];

export default function DocsPage() {
  // Knowledge base URL - will be set when Tawk.to is configured
  const knowledgeBaseUrl = process.env.NEXT_PUBLIC_TAWKTO_KB_URL;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/support">
              <Button variant="ghost">Support</Button>
            </Link>
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/5 via-transparent to-primary/10 py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Documentation</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know to run your safe ride program with StaySafeOS.
            </p>
            {knowledgeBaseUrl && (
              <div className="mt-8">
                <Link href={knowledgeBaseUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg">
                    View Full Knowledge Base
                    <ExternalLinkIcon />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Documentation Categories */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {docCategories.map((category) => (
                <DocCategory key={category.title} {...category} />
              ))}
            </div>
          </div>
        </section>

        {/* Additional Resources */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Additional Resources</h2>
            <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
              <ResourceCard
                icon={<VideoIcon />}
                title="Video Tutorials"
                description="Watch step-by-step video guides for common tasks."
              />
              <ResourceCard
                icon={<ApiIcon />}
                title="API Reference"
                description="Technical documentation for developers and integrations."
              />
              <ResourceCard
                icon={<CommunityIcon />}
                title="Community"
                description="Connect with other organizations using StaySafeOS."
              />
            </div>
          </div>
        </section>

        {/* Need Help CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Can&apos;t Find What You&apos;re Looking For?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Our support team is here to help. Reach out via live chat or email.
            </p>
            <Link href="/support">
              <Button size="lg">Contact Support</Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} StaySafeOS. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
              <Link href="/support" className="hover:text-foreground">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DocCategory({
  title,
  description,
  icon,
  docs,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  docs: { title: string; description: string }[];
}) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <ul className="space-y-3 mt-4">
        {docs.map((doc) => (
          <li key={doc.title}>
            <div className="group cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors">
              <p className="font-medium text-sm group-hover:text-primary transition-colors">
                {doc.title}
              </p>
              <p className="text-xs text-muted-foreground">{doc.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResourceCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

// Icons
function RocketIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.958 9.042a24.504 24.504 0 00-5.78-2.63 24.17 24.17 0 01-.927 5.346l-.028.085M17.78 17.78a24.504 24.504 0 00-2.63-5.78 24.17 24.17 0 015.346-.927l.085-.028M12.958 9.042A24.504 24.504 0 0117.78 6.22a24.17 24.17 0 01.927 5.346l.028.085M9.042 12.958a24.504 24.504 0 00-2.822 4.822 24.17 24.17 0 015.346.927l.085.028m0 0a24.504 24.504 0 004.822-2.822m-10.168 0l2.12-2.12m5.928 5.928l2.12-2.12" />
    </svg>
  );
}

function DispatchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function VehicleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ApiIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}

function CommunityIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
