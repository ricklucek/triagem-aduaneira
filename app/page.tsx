import Link from "next/link";
import { PageHeader, PageShell, PrimaryButton, Stack } from "@/components/ui/form-layout";

export default function HomePage() {
  return (
    <PageShell>
      <PageHeader
        title="Triagem Aduaneira"
        subtitle="Acesse o login e os painéis por perfil para consumir dados via API."
      />

      <Stack>
        <Link href="/login">
          <PrimaryButton>Entrar com login e senha</PrimaryButton>
        </Link>

        <Link href="/dashboard">
          <PrimaryButton>Ir para Dashboard de Escopos</PrimaryButton>
        </Link>
      </Stack>
    </PageShell>
  );
}
