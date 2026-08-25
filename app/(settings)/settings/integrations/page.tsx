import { OrganizationIntegrationsManager } from "@/components/settings/organization-integrations-manager";

export default async function IntegrationsSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  return <OrganizationIntegrationsManager returnTo={params.returnTo} />;
}
