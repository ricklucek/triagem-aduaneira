import Link from "next/link";
import { PageHeader, PageShell, PrimaryButton, Stack } from "@/components/ui/form-layout";

export default function HomePage() {
  return (
    <PageShell>
      <PageHeader
        title="Protótipo de Escopos"
        subtitle="Acesso rápido ao dashboard e criação de novo escopo."
      />

      <Stack>
        <Link href="/dashboard">
          <PrimaryButton>Ir para Dashboard</PrimaryButton>
        </Link>

        <Link href="/scopes/new">
          <PrimaryButton>Criar Novo Escopo</PrimaryButton>
        </Link>
      </Stack>
    </PageShell>
  );
}