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
    <main className="gap-10 flex flex-col">
      <h2 className="text-xl font-semibold tracking-tight">
        Dados bancários do cliente para devolução de saldo
      </h2>
      <ContaBancariaBlock
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
          agencia:
            errors["financeiro.dadosBancariosClienteDevolucaoSaldo.agencia"],
          conta: errors["financeiro.dadosBancariosClienteDevolucaoSaldo.conta"],
        }}
      />

      <Field label="Observações do financeiro" hint="Campo opcional">
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
    </main>
  );
}
