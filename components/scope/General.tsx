"use client";

import { EscopoForm } from "@/domain/scope/types";

import {
  Card,
} from "@/components/ui/form-layout";

import { Field, TextArea } from "@/components/ui/form-fields";


type Props = {
  form: EscopoForm;
  onChange: (next: EscopoForm) => void;
};

export default function ScopeWizard({
  form,
  onChange
}: Props) {

  return (
    <Card>
      <Field label="Observações gerais" hint="">
        <TextArea
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
