"use client";

import { EscopoForm } from "@/domain/scope/types";

import { Card } from "@/components/ui/form-layout";
import { Field, TextArea } from "@/components/ui/form-fields";

type Props = {
  form: EscopoForm;
  onChange: (next: EscopoForm) => void;
};

export default function ScopeWizard({ form, onChange }: Props) {
  return (
    <Card>
      <Field
        label="Atividade principal"
        hint="Campo opcional. Descreva a atuação principal e outras características relevantes da empresa."
      >
        <TextArea
          className="min-h-32 bg-background"
          value={form.geral?.descricao ?? ""}
          onChange={(e) =>
            onChange({
              ...form,
              geral: {
                descricao: e.target.value,
              },
            })
          }
        />
      </Field>
    </Card>
  );
}
