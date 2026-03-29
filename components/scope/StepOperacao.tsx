"use client";

import { EscopoForm } from "@/domain/scope/types";
import { Checkbox } from "@/components/ui/form-fields";
import { Section, Stack } from "@/components/ui/form-layout";

type Props = {
  form: EscopoForm;
  errors: Record<string, string>;
  onChange: (next: EscopoForm) => void;
};

export default function StepOperacao({ form, errors, onChange }: Props) {
  function toggle(tipo: "IMPORTACAO" | "EXPORTACAO", checked: boolean) {
    const set = new Set(form.operacao.tipos);
    if (checked) set.add(tipo);
    else set.delete(tipo);

    const tipos = Array.from(set) as ("IMPORTACAO" | "EXPORTACAO")[];

    onChange({
      ...form,
      operacao: {
        ...form.operacao,
        tipos,
        importacao: tipos.includes("IMPORTACAO")
          ? form.operacao.importacao
          : undefined,
        exportacao: tipos.includes("EXPORTACAO")
          ? form.operacao.exportacao
          : undefined,
      },
      servicos: {
        ...form.servicos,
        importacao: tipos.includes("IMPORTACAO")
          ? form.servicos.importacao
          : undefined,
        exportacao: tipos.includes("EXPORTACAO")
          ? form.servicos.exportacao
          : undefined,
      },
    });
  }

  return (
    <main className="gap-5 flex flex-col">
      <p className="text-sm text-muted-foreground sm:text-base">
        Selecione uma ou mais operações para abrir os blocos correspondentes.
      </p>
      <Stack>
        <Checkbox
          label="Importação"
          checked={form.operacao.tipos.includes("IMPORTACAO")}
          onChange={(checked) => toggle("IMPORTACAO", checked)}
        />
        <Checkbox
          label="Exportação"
          checked={form.operacao.tipos.includes("EXPORTACAO")}
          onChange={(checked) => toggle("EXPORTACAO", checked)}
        />

        {errors["operacao.tipos"] ? (
          <div style={{ color: "#b42318", fontSize: 12 }}>
            {errors["operacao.tipos"]}
          </div>
        ) : null}
      </Stack>
    </main>
  );
}
