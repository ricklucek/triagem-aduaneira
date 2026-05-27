"use client";

import type { EscopoForm } from "@/domain/scope/types";
import { Card } from "@/components/ui/form-layout";
import { Field, TextArea } from "@/components/ui/form-fields";

type Props = {
  form: EscopoForm;
  onChange: (next: EscopoForm) => void;
};

export default function General({ form, onChange }: Props) {
  return (
    <Card>
      <Field label="Observações gerais" hint="Informações internas ou complementares sobre o escopo.">
        <TextArea
          value={form.general?.description ?? ""}
          onChange={(event) =>
            onChange({
              ...form,
              general: {
                ...form.general,
                description: event.target.value,
              },
            })
          }
        />
      </Field>
    </Card>
  );
}
