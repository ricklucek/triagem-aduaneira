"use client";

import { EscopoForm } from "@/domain/scope/types";
import ContaBancariaBlock from "./blocks/ContaBancariaBlock";
import { Field, TextArea } from "@/components/ui/form-fields";

type Props = {
  form: EscopoForm;
  errors: Record<string, string>;
  onChange: (next: EscopoForm) => void;
};

const BANCOS_SUGERIDOS = [
  "Banco do Brasil — 001",
  "Caixa Econômica Federal — 104",
  "Bradesco — 237",
  "Itaú Unibanco — 341",
  "Santander Brasil — 033",
  "Sicoob — 756",
  "Sicredi — 748",
];

export default function StepFinanceiro({ form, errors, onChange }: Props) {
  return (
    <main className="gap-10 flex flex-col">
      <h2 className="text-xl font-semibold tracking-tight">
        Dados bancários do cliente para devolução de saldo
      </h2>
      <ContaBancariaBlock
        value={form.financeiro.dadosBancariosClienteDevolucaoSaldo}
        bancoOptions={BANCOS_SUGERIDOS}
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
