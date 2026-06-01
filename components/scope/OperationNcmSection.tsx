"use client";

import type { OperationDraft } from "@/domain/scope/schema";

import { Button } from "@/components/ui/button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/form-fields";
import { Card, Grid } from "@/components/ui/form-layout";
import { formatNCM } from "@/utils/format";

type OperationNcm = OperationDraft["ncms"][number];

type OperationNcmSectionProps = {
  ncms: OperationNcm[];
  ncmNotes: string | null | undefined;
  onChangeNcms: (next: OperationNcm[]) => void;
  onChangeNotes: (next: string) => void;
  error?: string;
};

const emptyNcm: OperationNcm = {
  code: "",
  description: null,
  hasBenefit: null,
  benefitDescription: null,
};

export default function OperationNcmSection({
  ncms,
  ncmNotes,
  onChangeNcms,
  onChangeNotes,
  error,
}: OperationNcmSectionProps) {
  const visibleNcms = ncms.length > 0 ? ncms : [emptyNcm];

  function updateNcm(index: number, patch: Partial<OperationNcm>) {
    const next = [...visibleNcms];
    next[index] = { ...next[index], ...patch };
    onChangeNcms(next);
  }

  function removeNcm(index: number) {
    onChangeNcms(visibleNcms.filter((_, currentIndex) => currentIndex !== index));
  }

  return (
    <div className="grid gap-3">
      {visibleNcms.map((item, index) => (
        <Card key={index} className="gap-4 p-4">
          <Grid columns={2}>
            <Field
              label={index === 0 ? "NCM principal" : `NCM ${index + 1}`}
              required
              error={index === 0 ? error : undefined}
            >
              <TextInput
                value={formatNCM(item.code ?? "")}
                onChange={(event) => updateNcm(index, { code: event.target.value })}
              />
            </Field>

            <Field label="Possui benefício?" required>
              <Select
                value={item.hasBenefit === true ? "true" : item.hasBenefit === false ? "false" : ""}
                onChange={(event) => {
                  const hasBenefit = event.target.value === "" ? null : event.target.value === "true";
                  updateNcm(index, {
                    hasBenefit,
                    benefitDescription: hasBenefit ? item.benefitDescription ?? "" : null,
                  });
                }}
              >
                <option value="">Selecione</option>
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </Select>
            </Field>
          </Grid>

          {item.hasBenefit ? (
            <Field label="Descrição do benefício">
              <TextInput
                value={item.benefitDescription ?? ""}
                onChange={(event) => updateNcm(index, { benefitDescription: event.target.value })}
              />
            </Field>
          ) : null}

          {visibleNcms.length > 1 ? (
            <Button type="button" variant="destructive" onClick={() => removeNcm(index)}>
              Remover
            </Button>
          ) : null}
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => onChangeNcms([...visibleNcms, emptyNcm])}
      >
        + Adicionar NCM
      </Button>

      <Field label="Observação sobre NCMs" hint="Campo opcional">
        <TextArea value={ncmNotes ?? ""} onChange={(event) => onChangeNotes(event.target.value)} />
      </Field>
    </div>
  );
}
