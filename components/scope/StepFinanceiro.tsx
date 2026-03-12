"use client";

import { EscopoForm } from "@/domain/scope/types";
import ContaBancariaBlock from "./blocks/ContaBancariaBlock";
import { Field, TextArea } from "@/components/ui/form-fields";
import { Section, Stack } from "@/components/ui/form-layout";

type Props = {
  form: EscopoForm;
  errors: Record<string, string>;
  onChange: (next: EscopoForm) => void;
};

export default function StepFinanceiro({ form, errors, onChange }: Props) {
  return (
    <Section
      title="Financeiro"
      description="Dados bancários do cliente para devolução de saldo e observações financeiras."
    >
      <Stack>
        <ContaBancariaBlock
          title="Dados bancários do cliente para devolução de saldo"
          value={form.financeiro.dadosBancariosClienteDevolucaoSaldo}
          onChange={(nextConta) =>
            onChange({
              ...form,
              financeiro: {
                ...form.financeiro,
                dadosBancariosClienteDevolucaoSaldo: nextConta,
              },
            })
          }
          errors={{
            banco: errors["financeiro.dadosBancariosClienteDevolucaoSaldo.banco"],
            agencia: errors["financeiro.dadosBancariosClienteDevolucaoSaldo.agencia"],
            conta: errors["financeiro.dadosBancariosClienteDevolucaoSaldo.conta"],
          }}
        />

        <Field
          label="Observações do financeiro"
          hint="Campo opcional"
        >
          <TextArea
            value={form.financeiro.observacoesFinanceiro ?? ""}
            onChange={(e) =>
              onChange({
                ...form,
                financeiro: {
                  ...form.financeiro,
                  observacoesFinanceiro: e.target.value,
                },
              })
            }
          />
        </Field>
      </Stack>
    </Section>
  );
}