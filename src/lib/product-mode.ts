import { headers } from "next/headers";

export type ProductMode = "demo" | "app";

export async function getProductMode(): Promise<ProductMode> {
  return (await headers()).get("x-skill-dockyard-mode") === "demo" ? "demo" : "app";
}
