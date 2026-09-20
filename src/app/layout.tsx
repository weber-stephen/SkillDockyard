import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Skill Dockyard — Keep your team's AI workflows current",
  description: "Review, approve, and reuse the AI instructions your team improves together.",
  openGraph: {
    type: "website",
    title: "Skill Dockyard — Keep your team's AI workflows current",
    description: "Review, approve, and reuse the AI instructions your team improves together."
  },
  twitter: {
    card: "summary_large_image",
    title: "Skill Dockyard — Keep your team's AI workflows current",
    description: "Review, approve, and reuse the AI instructions your team improves together."
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
