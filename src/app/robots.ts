import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://skilldockyard.com";
  return {
    rules: [{ userAgent: "*", allow: ["/", "/demo", "/login", "/signup", "/privacy", "/terms", "/support"], disallow: ["/app", "/api", "/invite", "/auth", "/reset-password"] }],
    sitemap: `${site}/sitemap.xml`,
    host: site
  };
}
