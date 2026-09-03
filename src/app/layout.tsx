import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skill Dockyard",
  description: "Private skill library for preserving AI skill improvements."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
