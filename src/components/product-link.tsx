"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";

export function ProductLink({ href, ...props }: Omit<React.ComponentProps<typeof NextLink>, "href"> & { href: string }) {
  const pathname = usePathname();
  const prefix = pathname.startsWith("/demo") ? "/demo" : pathname.startsWith("/app") ? "/app" : "";
  const target = typeof href === "string" && href.startsWith("/") && !href.startsWith("/api/") && !href.startsWith("/app") && !href.startsWith("/demo")
    ? `${prefix}${href === "/" ? "" : href}`
    : href;
  return <NextLink href={target as never} {...props} />;
}
