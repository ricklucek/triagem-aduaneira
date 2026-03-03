"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { getScope, saveDraft } from "@/lib/scope/store";

import { Scope } from "@/lib/scope/schema";

import StepCliente from "@/components/scope/steps/step-client";
import StepServicos from "@/components/scope/steps/step-services";
const etapas = ["Cliente", "Contatos", "Operação", "Serviços"];

export default function ScopePage() {
    const { scopeId } = useParams<{ scopeId: string }>();
    const router = useRouter();
    const [scope, setScope] = useState<Scope | null>(null);
    const [etapa, setEtapa] = useState(0);

    useEffect(() => {
        // const rec = getScope(scopeId);
        // if (!rec) {
        //     alert("Escopo não encontrado.");
        //     router.push("/dashboard");
        //     return;
        // }
        // setScope(rec.draft);
    }, [scopeId]);

    if (!scope) return <div>Carregando...</div>;

    function atualizar(draft: Scope) {
        setScope(draft);
        // saveDraft(scopeId, draft);
    }

    function validar() {
        if (!scope) return;
        // const resultado = validateScopeForPublish(scope);
        // alert(
        //     `Erros: ${resultado.errors.length}\nWarnings: ${resultado.warnings.length}\nCompletude: ${resultado.completeness_score}%`
        // );
    }

    function publicar() {
        if (!scope) return;
        // const resultado = validateScopeForPublish(scope);
        // if (resultado.errors.length > 0) {
        //     alert("Não é possível publicar. Existem erros.");
        //     return;
        // }
        // router.push(`/scopes/${scopeId}/publish`);
    }

    return (
        <div style={{ padding: 24 }}>
            <h1>Montagem do Escopo</h1>

            <div style={{ marginBottom: 20 }}>
                {etapas.map((e, i) => (
                    <button
                        key={i}
                        onClick={() => setEtapa(i)}
                        style={{
                            marginRight: 10,
                            fontWeight: etapa === i ? "bold" : "normal",
                        }}
                    >
                        {e}
                    </button>
                ))}
            </div>

            {/* {etapa === 0 && <StepCliente scope={scope} onChange={atualizar} />} */}
            {/* {etapa === 1 && <StepContatos scope={scope} onChange={atualizar} />}
            {etapa === 2 && <StepOperacao scope={scope} onChange={atualizar} />} */}
            {/* {etapa === 1 && <StepServicos scope={scope} onChange={atualizar} />} */}

            <div style={{ marginTop: 30 }}>
                <button onClick={validar}>Validar</button>
                <button onClick={publicar} style={{ marginLeft: 10 }}>
                    Publicar
                </button>
            </div>
        </div>
    );
}