import Link from "next/link";
import { Button } from "@staysafeos/ui";
import { Logo } from "@/components/logo";
import { TawkToWidget } from "@/components/tawkto-widget";

export const metadata = {
  title: "Support | StaySafeOS",
  description: "Get help with StaySafeOS - Live chat, documentation, and FAQs for drunk driving prevention programs.",
};

const faqs = [
  {
    question: "How do I create a new organization?",
    answer: "Sign in to your account, go to Organizations in the dashboard, and click 'Create New Organization'. You'll need to provide a name and choose a unique slug for your subdomain.",
  },
  {
    question: "How do I invite volunteers to my organization?",
    answer: "As an organization admin, go to your organization's dashboard and navigate to the Members section. You can invite volunteers by email, and they'll receive an invitation to join your program.",
  },
  {
    question: "What subscription plan do I need?",
    answer: "Our Free tier supports up to 3 vans and is great for small programs. For larger operations, our Starter ($99/mo), Growth ($199/mo), Pro ($299/mo), and Enterprise ($699/mo) plans offer more vans, SMS credits, and features.",
  },
  {
    question: "Can I use my own domain?",
    answer: "Yes! Custom domains are available on the Growth plan and above. Contact support to set up your custom domain, and we'll help you configure the DNS settings.",
  },
  {
    question: "How do riders request a ride?",
    answer: "Riders can request rides through your organization's branded app, via SMS (if enabled on your plan), or by calling your dispatch number. The dispatcher will see the request in real-time.",
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use industry-standard encryption for all data in transit and at rest. We're compliant with best practices for data protection and never sell your data.",
  },
  {
    question: "How do I cancel my subscription?",
    answer: "You can manage your subscription from the Billing page in your dashboard. Click 'Manage Subscription' to access the customer portal where you can cancel or modify your plan.",
  },
  {
    question: "Do you offer training for volunteers?",
    answer: "Yes! The platform includes built-in training modules for volunteers. Admins can track completion and require certifications before volunteers can be assigned to rides.",
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Tawk.to Widget */}
      <TawkToWidget />

      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/docs">
              <Button variant="ghost">Documentation</Button>
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
            <h1 className="text-4xl font-bold mb-4">How Can We Help?</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get answers to your questions, chat with our support team, or browse our documentation.
            </p>
          </div>
        </section>

        {/* Support Options */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
              <SupportCard
                icon={<ChatIcon />}
                title="Live Chat"
                description="Chat with our support team in real-time. Look for the chat bubble in the bottom right corner."
              />
              <SupportCard
                icon={<DocsIcon />}
                title="Documentation"
                description="Browse our knowledge base for guides, tutorials, and API documentation."
                href="/docs"
              />
              <SupportCard
                icon={<EmailIcon />}
                title="Email Support"
                description="Send us an email at support@staysafeos.com and we'll respond within 24 hours."
                href="mailto:support@staysafeos.com"
              />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="max-w-3xl mx-auto space-y-6">
              {faqs.map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Our support team is available to help you get the most out of StaySafeOS.
              Click the chat button or send us an email.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="mailto:support@staysafeos.com">
                <Button size="lg">Email Support</Button>
              </Link>
              <Link href="/docs">
                <Button size="lg" variant="outline">Browse Documentation</Button>
              </Link>
            </div>
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
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SupportCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-xl border bg-card p-6 h-full hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="font-semibold text-lg mb-2">{question}</h3>
      <p className="text-muted-foreground">{answer}</p>
    </div>
  );
}

// Icons
function ChatIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function DocsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
