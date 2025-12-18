import { Button } from "@staysafeos/ui";
import Link from "next/link";
import { Logo } from "@/components/logo";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#solutions" className="text-muted-foreground hover:text-foreground transition-colors">
              Solutions
            </Link>
            <Link href="/partners" className="text-muted-foreground hover:text-foreground transition-colors">
              Partners
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
          <div className="container mx-auto px-4 py-24 md:py-32 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Trusted by 50+ organizations nationwide
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
                Safe Rides Management,
                <br />
                <span className="text-primary">Built for Your Community</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg md:text-xl text-muted-foreground">
                The all-in-one platform for drunk driving prevention programs.
                Real-time dispatch, volunteer coordination, and seamless operations
                — branded as your own.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login">
                  <Button size="lg" className="w-full sm:w-auto px-8">
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/partners">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto px-8">
                    Find Your Organization
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="border-y bg-muted/30">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <StatItem value="50,000+" label="Safe Rides Completed" />
              <StatItem value="500+" label="Active Volunteers" />
              <StatItem value="99.9%" label="Uptime" />
              <StatItem value="24/7" label="Support Available" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 md:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">
                Everything You Need to Run Safe Rides
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                From ride requests to volunteer training, StaySafeOS handles every aspect
                of your drunk driving prevention program.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<DispatchIcon />}
                title="Real-Time Dispatch"
                description="Track ride requests live. Auto-assign drivers based on location and availability. Never miss a ride."
              />
              <FeatureCard
                icon={<VolunteerIcon />}
                title="Volunteer Management"
                description="Onboard volunteers with training videos, track certifications, and manage schedules all in one place."
              />
              <FeatureCard
                icon={<FleetIcon />}
                title="Fleet Operations"
                description="Monitor your vans in real-time, track maintenance, and optimize routes for faster pickups."
              />
              <FeatureCard
                icon={<MobileIcon />}
                title="Mobile Apps"
                description="Native iOS and Android apps for drivers. Riders can request pickup via SMS, call, or web."
              />
              <FeatureCard
                icon={<BrandingIcon />}
                title="White-Label Branding"
                description="Your logo, your colors, your domain. Make StaySafeOS completely yours with our customization tools."
              />
              <FeatureCard
                icon={<AnalyticsIcon />}
                title="Reports & Analytics"
                description="Track rides, measure volunteer hours, and generate reports for stakeholders and sponsors."
              />
            </div>
          </div>
        </section>

        {/* Solutions Section */}
        <section id="solutions" className="py-24 md:py-32 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">
                Built for Every Organization
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Whether you&apos;re a university, community program, or national organization,
                StaySafeOS scales with your needs.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <SolutionCard
                title="Universities & Colleges"
                description="Campus safe ride programs trust StaySafeOS to get students home safely. Integration with campus security systems and student ID authentication."
                features={["Student ID integration", "Campus boundary geofencing", "Peak hours scheduling", "Greek life partnerships"]}
              />
              <SolutionCard
                title="Community Organizations"
                description="Local nonprofits and civic groups use StaySafeOS to serve their communities during high-risk periods like holidays and major events."
                features={["Volunteer recruitment tools", "Donor management", "Event-based operations", "Multi-county coverage"]}
              />
              <SolutionCard
                title="Military Installations"
                description="Base safe ride programs ensure service members get home safely. Secure authentication and command-level reporting."
                features={["CAC card compatible", "Installation boundaries", "Command reporting", "24/7 operation support"]}
              />
              <SolutionCard
                title="National Programs"
                description="Multi-chapter organizations can manage all locations from a central dashboard while giving each chapter autonomy."
                features={["Multi-tenant architecture", "Central oversight", "Chapter autonomy", "Unified branding"]}
              />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 md:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">
                Up and Running in Minutes
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                No complex setup. No IT department required. Just sign up and start saving lives.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
              <StepCard
                number="1"
                title="Create Your Organization"
                description="Sign up, name your program, and choose your custom subdomain."
              />
              <StepCard
                number="2"
                title="Customize & Brand"
                description="Upload your logo, set your colors, and configure your service area."
              />
              <StepCard
                number="3"
                title="Go Live"
                description="Invite volunteers, train your team, and start accepting ride requests."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 md:py-32 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Make Your Community Safer?
            </h2>
            <p className="mt-4 text-lg opacity-90 max-w-2xl mx-auto">
              Join dozens of organizations using StaySafeOS to prevent drunk driving
              and save lives. Start your free trial today.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto px-8">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/partners">
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 bg-transparent border-white/30 text-white hover:bg-white/10">
                  Browse Partners
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Link href="/">
                <Logo size="md" />
              </Link>
              <p className="mt-4 text-sm text-muted-foreground">
                The platform for drunk driving prevention programs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#solutions" className="hover:text-foreground">Solutions</Link></li>
                <li><Link href="/partners" className="hover:text-foreground">Partners</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/docs" className="hover:text-foreground">Documentation</Link></li>
                <li><Link href="/support" className="hover:text-foreground">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} StaySafeOS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl md:text-4xl font-bold text-primary">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  );
}

function SolutionCard({
  title,
  description,
  features,
}: {
  title: string;
  description: string;
  features: string[];
}) {
  return (
    <div className="rounded-xl border bg-card p-8">
      <h3 className="text-2xl font-semibold">{title}</h3>
      <p className="mt-3 text-muted-foreground">{description}</p>
      <ul className="mt-6 space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm">
            <CheckIcon />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
        {number}
      </div>
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  );
}

// Icons
function DispatchIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function VolunteerIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function FleetIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  );
}

function MobileIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function BrandingIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
