"use client";

import { useParams, useRouter } from "next/navigation";
import { getScope } from "@/lib/store/scopeRepo";
import { validateScopeForPublish } from "@/lib/validators/scopeValidate";

export default function PublishPage() {
  const { scopeId } = useParams<{ scopeId: string }>();
  const router = useRouter();
  const rec = getScope(scopeId);

  if (!rec) return <div>Escopo não encontrado.</div>;

  const resultado = validateScopeForPublish(rec.draft);

  if (resultado.errors.length > 0) {
    return (
      <div>
        <h2>Erros impedem publicação</h2>
        <pre>{JSON.stringify(resultado.errors, null, 2)}</pre>
        <button onClick={() => router.back()}>Voltar</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Escopo publicado com sucesso (simulação)</h2>
      <p>Versão criada localmente.</p>
      <button onClick={() => router.push(`/scopes/${scopeId}`)}>
        Voltar
      </button>
    </div>
  );
}