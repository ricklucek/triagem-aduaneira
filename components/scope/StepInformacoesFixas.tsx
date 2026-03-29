"use client";

import ContaBancariaBlock from "./blocks/ContaBancariaBlock";
import { EscopoForm } from "@/domain/scope/types";
import { Field, NumberInput } from "@/components/ui/form-fields";
import { Section, Stack } from "@/components/ui/form-layout";

type Props = {
  form: EscopoForm;
  errors: Record<string, string>;
  onChange: (next: EscopoForm) => void;
};

export default function StepInformacoesFixas({
  form,
  errors,
  onChange,
}: Props) {
  return (
    <Stack>
      <Section
        title="Informações Fixas"
        description="Parâmetros globais usados no escopo."
      >
        <Stack>
          <Field
            label="Salário mínimo vigente"
            required
            error={errors["informacoesFixas.salarioMinimoVigente"]}
          >
            <NumberInput
              value={form.informacoesFixas.salarioMinimoVigente}
              onChange={(e) =>
                onChange({
                  ...form,
                  informacoesFixas: {
                    ...form.informacoesFixas,
                    salarioMinimoVigente: Number(e.target.value),
                  },
                })
              }
            />
          </Field>

          <ContaBancariaBlock
            title="Dados bancários Casco"
            value={form.informacoesFixas.dadosBancariosCasco}
            onChange={(nextConta) =>
              onChange({
                ...form,
                informacoesFixas: {
                  ...form.informacoesFixas,
                  dadosBancariosCasco: nextConta,
                },
              })
            }
            errors={{
              banco: errors["informacoesFixas.dadosBancariosCasco.banco"],
              agencia: errors["informacoesFixas.dadosBancariosCasco.agencia"],
              conta: errors["informacoesFixas.dadosBancariosCasco.conta"],
            }}
          />
        </Stack>
      </Section>
    </Stack>
  );
}
