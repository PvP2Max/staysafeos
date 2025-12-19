import { Button } from "@staysafeos/ui";
import Link from "next/link";
import { Logo } from "@/components/logo";

interface GlobalStats {
  totalRidesCompleted: number;
  totalVolunteersTrained: number;
  totalOrganizationsServed: number;
}

async function fetchGlobalStats(): Promise<GlobalStats | null> {
  try {
    const apiUrl = process.env.API_URL || "https://api.staysafeos.com";
    const response = await fetch(`${apiUrl}/v1/global-stats`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${Math.floor(num / 1000)}k+`;
  }
  return num > 0 ? `${num}+` : "0";
}

export default async function HomePage() {
  const stats = await fetchGlobalStats();
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
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
        {/* Hero Section - Two Column Layout */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left Column - Content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Trusted by 50+ organizations nationwide
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                  Every Ride Home
                  <br />
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Could Save a Life
                  </span>
                </h1>
                <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
                  The all-in-one platform for drunk driving prevention programs.
                  Real-time dispatch, volunteer coordination, and seamless operations
                  — branded as your own.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link href="/login">
                    <Button size="lg" className="w-full sm:w-auto px-8 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                      Start Free Trial
                    </Button>
                  </Link>
                  <Link href="/partners">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto px-8">
                      Find Your Organization
                    </Button>
                  </Link>
                </div>
                {/* Mini trust logos */}
                <div className="mt-10 pt-8 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">Trusted by leading organizations</p>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 opacity-60">
                    <PlaceholderLogo name="University" />
                    <PlaceholderLogo name="Military" />
                    <PlaceholderLogo name="Community" />
                    <PlaceholderLogo name="National" />
                  </div>
                </div>
              </div>

              {/* Right Column - Dashboard Mockup */}
              <div className="relative lg:pl-8">
                <div className="relative">
                  {/* Glow effect behind mockup */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/5 rounded-3xl blur-2xl" />
                  <DashboardMockup />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Logo Trust Bar */}
        <section className="border-y bg-muted/20 py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center">
              <p className="text-sm text-muted-foreground mb-6">Powering safe ride programs across the nation</p>
              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                <LogoPlaceholder name="Fort Wainwright" type="military" />
                <LogoPlaceholder name="State University" type="university" />
                <LogoPlaceholder name="Community Safe Rides" type="community" />
                <LogoPlaceholder name="Campus Cruiser" type="university" />
                <LogoPlaceholder name="Operation Guardian" type="military" />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <StatItem
                value={stats ? formatNumber(stats.totalRidesCompleted) : "50,000+"}
                label="Safe Rides Completed"
                icon={<RideIcon />}
              />
              <StatItem
                value={stats ? formatNumber(stats.totalVolunteersTrained) : "500+"}
                label="Volunteers Trained"
                icon={<VolunteerStatIcon />}
              />
              <StatItem
                value={stats ? formatNumber(stats.totalOrganizationsServed) : "50+"}
                label="Organizations Served"
                icon={<OrgIcon />}
              />
              <StatItem
                value="24/7"
                label="Support Available"
                icon={<SupportIcon />}
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 md:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                Features
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Everything You Need to Run Safe Rides
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                From ride requests to volunteer training, StaySafeOS handles every aspect
                of your drunk driving prevention program.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<DispatchIcon />}
                title="Real-Time Dispatch"
                description="Track ride requests live. Auto-assign drivers based on location and availability. Never miss a ride."
                gradient="from-blue-500/20 to-cyan-500/20"
              />
              <FeatureCard
                icon={<VolunteerIcon />}
                title="Volunteer Management"
                description="Onboard volunteers with training videos, track certifications, and manage schedules all in one place."
                gradient="from-green-500/20 to-emerald-500/20"
              />
              <FeatureCard
                icon={<FleetIcon />}
                title="Fleet Operations"
                description="Monitor your vans in real-time, track maintenance, and optimize routes for faster pickups."
                gradient="from-orange-500/20 to-amber-500/20"
              />
              <FeatureCard
                icon={<MobileIcon />}
                title="Mobile Apps"
                description="Native iOS and Android apps for drivers. Riders can request pickup via SMS, call, or web."
                gradient="from-purple-500/20 to-pink-500/20"
              />
              <FeatureCard
                icon={<BrandingIcon />}
                title="White-Label Branding"
                description="Your logo, your colors, your domain. Make StaySafeOS completely yours with our customization tools."
                gradient="from-rose-500/20 to-red-500/20"
              />
              <FeatureCard
                icon={<AnalyticsIcon />}
                title="Reports & Analytics"
                description="Track rides, measure volunteer hours, and generate reports for stakeholders and sponsors."
                gradient="from-indigo-500/20 to-violet-500/20"
              />
            </div>
          </div>
        </section>

        {/* Product Preview Section */}
        <section className="py-24 md:py-32 bg-muted/30 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                Product Tour
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                See StaySafeOS in Action
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                A powerful dispatch dashboard designed for real-world safe ride operations.
              </p>
            </div>

            <div className="relative max-w-5xl mx-auto">
              {/* Feature callouts */}
              <div className="hidden lg:block absolute -left-4 top-1/4 transform -translate-x-full">
                <FeatureCallout
                  title="Live Map View"
                  description="Track all active rides and drivers in real-time"
                  align="right"
                />
              </div>
              <div className="hidden lg:block absolute -right-4 top-1/3 transform translate-x-full">
                <FeatureCallout
                  title="Smart Assignment"
                  description="AI-powered driver matching based on proximity"
                  align="left"
                />
              </div>
              <div className="hidden lg:block absolute -left-4 bottom-1/4 transform -translate-x-full">
                <FeatureCallout
                  title="Instant Alerts"
                  description="Real-time notifications for new requests"
                  align="right"
                />
              </div>

              {/* Large Dashboard Mockup */}
              <div className="relative">
                <div className="absolute -inset-8 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-3xl blur-3xl" />
                <LargeDashboardMockup />
              </div>
            </div>
          </div>
        </section>

        {/* Solutions Section */}
        <section id="solutions" className="py-24 md:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                Solutions
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Built for Every Organization
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Whether you&apos;re a university, community program, or national organization,
                StaySafeOS scales with your needs.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <SolutionCard
                title="Universities & Colleges"
                description="Campus safe ride programs trust StaySafeOS to get students home safely. Integration with campus security systems and student ID authentication."
                features={["Student ID integration", "Campus boundary geofencing", "Peak hours scheduling", "Greek life partnerships"]}
                gradient="from-blue-500/10 to-indigo-500/10"
              />
              <SolutionCard
                title="Community Organizations"
                description="Local nonprofits and civic groups use StaySafeOS to serve their communities during high-risk periods like holidays and major events."
                features={["Volunteer recruitment tools", "Donor management", "Event-based operations", "Multi-county coverage"]}
                gradient="from-green-500/10 to-teal-500/10"
              />
              <SolutionCard
                title="Military Installations"
                description="Base safe ride programs ensure service members get home safely. Secure authentication and command-level reporting."
                features={["CAC card compatible", "Installation boundaries", "Command reporting", "24/7 operation support"]}
                gradient="from-slate-500/10 to-zinc-500/10"
              />
              <SolutionCard
                title="National Programs"
                description="Multi-chapter organizations can manage all locations from a central dashboard while giving each chapter autonomy."
                features={["Multi-tenant architecture", "Central oversight", "Chapter autonomy", "Unified branding"]}
                gradient="from-purple-500/10 to-pink-500/10"
              />
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 md:py-32 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                Testimonials
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Trusted by Program Leaders
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Hear from organizations that have transformed their safe ride operations with StaySafeOS.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              <TestimonialCard
                quote="StaySafeOS transformed our campus safe ride program. We went from paper logs to real-time dispatch in a weekend. Our response times dropped by 40%."
                name="Sarah Mitchell"
                title="Program Director"
                org="State University Safe Rides"
              />
              <TestimonialCard
                quote="The volunteer management features alone saved us hours every week. Training, scheduling, certifications — it's all in one place now."
                name="Command Sgt. James Rivera"
                title="SADD Program Coordinator"
                org="Fort Wainwright"
              />
              <TestimonialCard
                quote="We serve three counties and StaySafeOS handles it all. The multi-tenant features let each chapter operate independently while we maintain oversight."
                name="Michael Chen"
                title="Executive Director"
                org="Community Safe Rides Network"
              />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 md:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                Getting Started
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Up and Running in Minutes
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                No complex setup. No IT department required. Just sign up and start saving lives.
              </p>
            </div>
            <div className="relative max-w-4xl mx-auto">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <div className="grid gap-8 md:grid-cols-3">
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
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 md:py-32 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                FAQ
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="max-w-3xl mx-auto space-y-4">
              <FAQItem
                question="How quickly can we get started?"
                answer="Most organizations are up and running within 24 hours. Our onboarding process is designed to be simple — just create an account, customize your branding, and you're ready to accept ride requests."
              />
              <FAQItem
                question="Do you integrate with existing systems?"
                answer="Yes! StaySafeOS integrates with popular campus security systems, student ID authentication, and CAC card verification for military installations. We also offer API access for custom integrations."
              />
              <FAQItem
                question="What support is available?"
                answer="We provide 24/7 support via chat, email, and phone. Every organization gets a dedicated onboarding specialist, plus access to our comprehensive documentation and training videos."
              />
              <FAQItem
                question="Is there a free trial?"
                answer="Absolutely. Start with our free trial to explore all features. No credit card required. When you're ready, choose a plan that fits your organization's size and needs."
              />
              <FAQItem
                question="Can we white-label the platform?"
                answer="Yes! Every organization gets their own subdomain (yourprogram.staysafeos.com), custom logo, brand colors, and personalized rider-facing pages. It looks and feels like your own platform."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 md:py-32 bg-primary text-primary-foreground relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }} />
          </div>
          <div className="container mx-auto px-4 text-center relative">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Start Saving Lives Today
            </h2>
            <p className="mt-6 text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
              Join dozens of organizations using StaySafeOS to prevent drunk driving.
              Your community deserves the best safe ride program possible.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto px-8 shadow-lg">
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
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#solutions" className="hover:text-foreground transition-colors">Solutions</Link></li>
                <li><Link href="/partners" className="hover:text-foreground transition-colors">Partners</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="/support" className="hover:text-foreground transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
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

// ============================================
// Component Definitions
// ============================================

function StatItem({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
        {icon}
      </div>
      <div className="text-3xl md:text-4xl font-bold text-primary">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group rounded-xl border bg-card p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform`}>
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
  gradient,
}: {
  title: string;
  description: string;
  features: string[];
  gradient: string;
}) {
  return (
    <div className={`rounded-xl border bg-gradient-to-br ${gradient} p-8 hover:shadow-lg transition-shadow`}>
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
    <div className="text-center relative">
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto shadow-lg shadow-primary/25">
        {number}
      </div>
      <h3 className="mt-6 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  );
}

function TestimonialCard({
  quote,
  name,
  title,
  org,
}: {
  quote: string;
  name: string;
  title: string;
  org: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <QuoteIcon />
      <p className="mt-4 text-muted-foreground italic">&ldquo;{quote}&rdquo;</p>
      <div className="mt-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-semibold">
          {name.charAt(0)}
        </div>
        <div>
          <div className="font-semibold text-sm">{name}</div>
          <div className="text-xs text-muted-foreground">{title}, {org}</div>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-xl border bg-card">
      <summary className="flex cursor-pointer items-center justify-between p-6 font-semibold list-none">
        {question}
        <ChevronIcon />
      </summary>
      <div className="px-6 pb-6 text-muted-foreground">
        {answer}
      </div>
    </details>
  );
}

function FeatureCallout({ title, description, align }: { title: string; description: string; align: 'left' | 'right' }) {
  return (
    <div className={`w-48 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <div className="bg-card border rounded-lg p-3 shadow-sm">
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-1">{description}</div>
      </div>
    </div>
  );
}

// Placeholder Components
function PlaceholderLogo({ name }: { name: string }) {
  return (
    <div className="h-6 px-3 bg-muted rounded text-xs font-medium flex items-center text-muted-foreground">
      {name}
    </div>
  );
}

function LogoPlaceholder({ name, type }: { name: string; type: 'military' | 'university' | 'community' }) {
  const colors = {
    military: 'bg-slate-200 text-slate-600',
    university: 'bg-blue-100 text-blue-600',
    community: 'bg-green-100 text-green-600',
  };
  return (
    <div className={`h-8 px-4 rounded-full ${colors[type]} text-xs font-medium flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity`}>
      <div className="w-4 h-4 rounded-full bg-current opacity-30" />
      {name}
    </div>
  );
}

// Dashboard Mockup Component
function DashboardMockup() {
  return (
    <div className="relative rounded-2xl border bg-card shadow-2xl overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 mx-4">
          <div className="h-6 bg-background rounded-md px-3 flex items-center text-xs text-muted-foreground">
            yourprogram.staysafeos.com
          </div>
        </div>
      </div>
      {/* Dashboard content mockup */}
      <div className="p-4 space-y-3">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="flex gap-2">
            <div className="h-6 w-6 bg-muted rounded-full" />
            <div className="h-6 w-6 bg-muted rounded-full" />
          </div>
        </div>
        {/* Map area */}
        <div className="h-40 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            </div>
            <div className="text-xs text-muted-foreground">Live Map View</div>
          </div>
        </div>
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-primary">12</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-green-500">8</div>
            <div className="text-xs text-muted-foreground">Drivers</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-amber-500">3</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
        </div>
        {/* Ride list preview */}
        <div className="space-y-2">
          <RideListItem status="active" />
          <RideListItem status="pending" />
        </div>
      </div>
    </div>
  );
}

function RideListItem({ status }: { status: 'active' | 'pending' }) {
  return (
    <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
      <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-green-500' : 'bg-amber-500'}`} />
      <div className="flex-1">
        <div className="h-3 w-24 bg-muted rounded" />
        <div className="h-2 w-32 bg-muted/50 rounded mt-1" />
      </div>
      <div className="h-6 w-16 bg-primary/10 rounded text-xs flex items-center justify-center text-primary">
        {status === 'active' ? 'En Route' : 'Waiting'}
      </div>
    </div>
  );
}

function LargeDashboardMockup() {
  return (
    <div className="relative rounded-2xl border bg-card shadow-2xl overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 mx-4">
          <div className="h-6 bg-background rounded-md px-3 flex items-center text-xs text-muted-foreground">
            dispatcher.staysafeos.com/dashboard
          </div>
        </div>
      </div>
      {/* Dashboard layout */}
      <div className="flex min-h-[400px]">
        {/* Sidebar */}
        <div className="w-48 border-r bg-muted/20 p-3 space-y-2">
          <div className="h-8 bg-primary/10 rounded flex items-center px-2 gap-2">
            <div className="w-4 h-4 bg-primary/30 rounded" />
            <div className="h-3 w-16 bg-primary/30 rounded" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-muted/50 rounded flex items-center px-2 gap-2">
              <div className="w-4 h-4 bg-muted rounded" />
              <div className="h-3 w-14 bg-muted rounded" />
            </div>
          ))}
        </div>
        {/* Main content */}
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-40 bg-muted rounded" />
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-primary rounded flex items-center justify-center text-xs text-primary-foreground">
                New Ride
              </div>
            </div>
          </div>
          {/* Map */}
          <div className="h-48 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 rounded-lg mb-4 relative overflow-hidden">
            {/* Fake map markers */}
            <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
            <div className="absolute top-1/2 right-1/4 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
            <div className="absolute bottom-1/3 left-1/2 w-4 h-4 bg-amber-500 rounded-full border-2 border-white shadow-lg" />
            <div className="absolute top-2/3 left-1/4 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg" />
            {/* Fake route line */}
            <div className="absolute top-1/4 left-1/3 w-32 h-0.5 bg-primary/30 transform rotate-45" />
          </div>
          {/* Stats cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Active Rides', value: '12', color: 'text-primary' },
              { label: 'Available Drivers', value: '8', color: 'text-green-500' },
              { label: 'Pending', value: '3', color: 'text-amber-500' },
              { label: 'Completed Today', value: '47', color: 'text-muted-foreground' },
            ].map((stat) => (
              <div key={stat.label} className="bg-muted/30 rounded-lg p-3">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Icons
// ============================================

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

function QuoteIcon() {
  return (
    <svg className="w-8 h-8 text-primary/30" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function RideIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function VolunteerStatIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function OrgIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
