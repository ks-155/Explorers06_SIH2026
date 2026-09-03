import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { OfflineBanner } from "@/components/OfflineBanner";

export const metadata: Metadata = {
  title: "SOIS - Skilling Outcomes Intelligence System",
  description:
    "Consent-based longitudinal outcome tracking for skill training (trainee portal)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e293b" />
      </head>
      <body className="antialiased overflow-x-hidden bg-gray-50">
        <OfflineBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}