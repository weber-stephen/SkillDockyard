import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { publicSiteOrigin } from "@/lib/safe-redirect";

const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-figtree"
});

export const metadata: Metadata = {
  metadataBase: new URL(publicSiteOrigin("http://localhost:3000")),
  title: "Skill Dockyard — Keep your team's AI workflows current",
  description: "Review, publish, and reuse the AI instructions your team improves together.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "Skill Dockyard — Keep your team's AI workflows current",
    description: "Review, publish, and reuse the AI instructions your team improves together."
  },
  twitter: {
    card: "summary_large_image",
    title: "Skill Dockyard — Keep your team's AI workflows current",
    description: "Review, publish, and reuse the AI instructions your team improves together."
  }
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Reading the per-request nonce keeps this layout dynamic. Next.js can then
  // attach the proxy-issued nonce to its inline hydration scripts, which CSP
  // otherwise blocks on statically rendered pages.
  await headers();

  return (
    <html lang="en" className={figtree.variable}>
      <body className="font-sans">
        {children}
        <AnalyticsProvider containerId={process.env.NEXT_PUBLIC_GTM_CONTAINER_ID} />
      </body>
    </html>
  );
}
