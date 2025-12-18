import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Terms of Service | StaySafeOS",
  description: "Terms of Service for StaySafeOS - Read our terms and conditions for using our platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/">
            <Logo size="md" />
          </Link>
        </div>
      </header>

      <main className="flex-1 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: December 2024</p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using StaySafeOS (&quot;the Platform&quot;), you agree to be bound by these
                Terms of Service. If you do not agree to these terms, please do not use our services.
                These terms apply to all users, including organizations, administrators, volunteers,
                drivers, and riders.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                StaySafeOS is a multi-tenant software platform designed to help organizations manage
                drunk driving prevention programs. The Platform provides tools for ride dispatch,
                volunteer management, fleet operations, and related services. StaySafeOS does not
                directly provide transportation services; we provide software to organizations that
                operate their own safe ride programs.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To use certain features, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly update any changes to your information</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Organization Responsibilities</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Organizations using StaySafeOS are responsible for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Ensuring their safe ride program complies with all applicable laws</li>
                <li>Properly vetting and training volunteers and drivers</li>
                <li>Maintaining appropriate insurance coverage</li>
                <li>Managing their members and user access appropriately</li>
                <li>Ensuring vehicle safety and maintenance</li>
                <li>Handling any incidents or disputes within their program</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. User Conduct</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Use the Platform for any unlawful purpose</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Impersonate any person or entity</li>
                <li>Interfere with or disrupt the Platform&apos;s operation</li>
                <li>Attempt to gain unauthorized access to any systems</li>
                <li>Use automated systems to access the Platform without permission</li>
                <li>Transmit viruses or malicious code</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Subscription and Payment</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Organizations may subscribe to paid plans with the following terms:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Subscription fees are billed in advance on a monthly basis</li>
                <li>All fees are non-refundable unless otherwise stated</li>
                <li>We may change pricing with 30 days notice</li>
                <li>Failure to pay may result in service suspension</li>
                <li>You authorize us to charge your payment method automatically</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Platform and its original content, features, and functionality are owned by
                StaySafeOS and are protected by copyright, trademark, and other intellectual property
                laws. You may not copy, modify, distribute, or create derivative works without our
                express written permission. Your organization retains ownership of data you submit
                to the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed">
                THE PLATFORM IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
                EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, SECURE,
                OR ERROR-FREE. WE MAKE NO WARRANTIES REGARDING THE RELIABILITY, ACCURACY, OR AVAILABILITY
                OF THE PLATFORM. STAYSAFEOS IS A SOFTWARE PROVIDER AND DOES NOT GUARANTEE THE SAFETY
                OR QUALITY OF TRANSPORTATION SERVICES PROVIDED BY ORGANIZATIONS USING OUR PLATFORM.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, STAYSAFEOS SHALL NOT BE LIABLE FOR ANY INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS,
                DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE PLATFORM. OUR TOTAL LIABILITY SHALL
                NOT EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE MONTHS PRECEDING THE CLAIM.
                STAYSAFEOS IS NOT LIABLE FOR ANY INCIDENTS, ACCIDENTS, OR HARM ARISING FROM
                TRANSPORTATION SERVICES OPERATED BY ORGANIZATIONS USING OUR PLATFORM.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to indemnify and hold harmless StaySafeOS and its officers, directors,
                employees, and agents from any claims, damages, losses, or expenses arising from
                your use of the Platform, your violation of these terms, or your organization&apos;s
                operation of safe ride services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate or suspend your access to the Platform immediately, without prior
                notice, for conduct that we believe violates these terms or is harmful to other users
                or the Platform. Upon termination, your right to use the Platform will cease immediately.
                Organizations may export their data before termination upon request.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These terms shall be governed by and construed in accordance with the laws of the
                United States, without regard to conflict of law principles. Any disputes shall be
                resolved in the courts of competent jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of
                material changes by posting the updated terms on this page and updating the
                &quot;Last updated&quot; date. Continued use of the Platform after changes constitutes
                acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-muted-foreground mt-4">
                <strong>Email:</strong> legal@staysafeos.com<br />
                <strong>Support:</strong> <Link href="/support" className="text-primary hover:underline">Visit our support page</Link>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t">
            <Link href="/" className="text-primary hover:underline">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-card">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} StaySafeOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
