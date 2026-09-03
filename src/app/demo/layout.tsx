import { AppShell } from "@/components/app-shell";
import { DemoSetupReturn } from "@/components/demo-setup-return";
export default function DemoLayout({ children }: { children: React.ReactNode }) { return <><DemoSetupReturn /><AppShell mode="demo">{children}</AppShell></>; }
