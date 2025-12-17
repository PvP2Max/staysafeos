import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "StaySafeOS - Drunk Driving Prevention Platform",
  description:
    "Multi-tenant SaaS platform for SADD (Soldiers Against Drunk Driving) programs. Manage ride requests, dispatch vans, and coordinate volunteers.",
  metadataBase: new URL("https://staysafeos.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans min-h-screen bg-background text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
