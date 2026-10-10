import { SettingsForm } from "@/components/settings-form";
import { getSettings } from "@/lib/settings";

export default async function RepoSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-black">Import settings</h1>
        <p className="mt-2 text-muted-foreground">Review examples of the folders and files you can import into Skill Dockyard.</p>
      </header>
      <SettingsForm {...settings} />
    </div>
  );
}
