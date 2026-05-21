"use client";

import { EscopoForm } from "@/domain/scope/types";
import ContaBancariaBlock from "./blocks/ContaBancariaBlock";
import { Field, Select, TextArea, TextInput } from "@/components/ui/form-fields";
import { Button } from "../ui/button";

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
        Dados financeiros do cliente para devolução de saldo
      </h2>

      <Field label="Preferência de pagamento" hint="Selecione a preferência de pagamento">
        <Select
          value={form.financeiro?.preferencia ?? "TRANSFERECIA"}
          onChange={(e) =>
            onChange({
              ...form,
              financeiro: {
                ...form.financeiro,
                preferencia: e.target.value as "TRANSFERECIA" | "BOLETO" | "PIX",
              },
            })
          }
        >
          <option value="TRANSFERECIA">Transferência</option>
          <option value="BOLETO">Boleto</option>
          <option value="PIX">PIX</option>
        </Select>
      </Field>

      {
        form.financeiro.preferencia === "TRANSFERECIA" && (
          <>
            {(form.financeiro.dadosBancariosClienteDevolucaoSaldo ?? []).map((conta, index) => (
              <div key={index} className="flex flex-col gap-2">
                <ContaBancariaBlock
                  title={`Conta bancária ${index + 1}`}
                  value={conta}
                  bancoOptions={BANCOS_SUGERIDOS}
                  onChange={(nextConta) => {
                    const next = [...(form.financeiro.dadosBancariosClienteDevolucaoSaldo ?? [])];
                    next[index] = nextConta;
                    onChange({ ...form, financeiro: { ...form.financeiro, dadosBancariosClienteDevolucaoSaldo: next } });
                  }}
                  errors={{}}
                />
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => onChange({ ...form, financeiro: { ...form.financeiro, dadosBancariosClienteDevolucaoSaldo: [...(form.financeiro.dadosBancariosClienteDevolucaoSaldo ?? []), { banco: '', agencia: '', conta: '' }] } })}>+ Adicionar conta</Button>
          </>
        )
      }

      {
        form.financeiro.preferencia === "PIX" && (
          <Field
            label="Chave PIX para devolução de saldo"
            hint="Informe a chave PIX do cliente para devolução de saldo"
          >
            <TextInput
              value={form.financeiro.chavePIXClienteDevolucaoSaldo ?? ""}
              onChange={(e) => onChange({ ...form, financeiro: { ...form.financeiro, chavePIXClienteDevolucaoSaldo: e.target.value } })}
            />
          </Field>
        )
      }

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