import { ScopeWizard } from "@/components/scope/scope-wizard";

export default function NewScopePage({ params }: { params: { cnpj: string } }) {
  return <ScopeWizard cnpj={params.cnpj} />;
}