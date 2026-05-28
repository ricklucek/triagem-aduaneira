"use client";

import { Plus, Trash2 } from "lucide-react";

import type { EscopoForm } from "@/domain/scope/types";

import { Button } from "@/components/ui/button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/form-fields";
import { Card, Grid, Stack, Toolbar } from "@/components/ui/form-layout";

import {
  emptyRefundBankAccount,
} from "./canonical-draft";

function fieldError(errors: Record<string, string>, ...paths: string[]) {
  for (const path of paths) {
    if (errors[path]) return errors[path];
  }
  return undefined;
}

export default function FinancialStep({ form, patchForm, errors }: { form: EscopoForm; patchForm: (patch: Partial<EscopoForm>) => void; errors: Record<string, string> }) {
  const financial = form.financial;

  function patchFinancial(patch: any) {
    patchForm({ financial: { ...financial, ...patch } } as Partial<EscopoForm>);
  }

  function updateAccount(index: number, patch: any) {
    const refundBankAccounts = [...(financial.refundBankAccounts ?? [])];
    refundBankAccounts[index] = { ...refundBankAccounts[index], ...patch };
    patchFinancial({ refundBankAccounts });
  }

  return (
    <Stack>
      <Card>
        <h3 className="text-base font-semibold">Financeiro</h3>
        <Grid columns={2}>
          <Field label="Preferência de pagamento" error={fieldError(errors, "financial.paymentPreference")}>
            <Select value={financial.paymentPreference ?? ""} onChange={(e) => patchFinancial({ paymentPreference: e.target.value })}>
              <option value="BANK_TRANSFER">Transferência bancária</option>
              <option value="PIX">PIX</option>
              <option value="BANK_SLIP">Boleto</option>
              <option value="OTHER">Outro</option>
            </Select>
          </Field>
          <Field label="Chave PIX" error={fieldError(errors, "financial.refundPixKey")}>
            <TextInput value={financial.refundPixKey ?? ""} onChange={(e) => patchFinancial({ refundPixKey: e.target.value })} />
          </Field>
          <Field label="Observações financeiras">
            <TextArea value={financial.notes ?? ""} onChange={(e) => patchFinancial({ notes: e.target.value })} />
          </Field>
        </Grid>
      </Card>

      <Card>
        <Toolbar
          left={<h3 className="text-base font-semibold">Contas bancárias para devolução</h3>}
          right={<Button type="button" variant="outline" onClick={() => patchFinancial({ refundBankAccounts: [...(financial.refundBankAccounts ?? []), emptyRefundBankAccount()] })}><Plus className="mr-2 h-4 w-4" />Adicionar conta</Button>}
        />
        <Stack>
          {(financial.refundBankAccounts ?? []).map((account, index) => (
            <Grid columns={2} key={account.id ?? index}>
              <Field label="Banco">
                <TextInput value={account.bankName ?? ""} onChange={(e) => updateAccount(index, { bankName: e.target.value })} />
              </Field>
              <Field label="Agência">
                <TextInput value={account.branch ?? ""} onChange={(e) => updateAccount(index, { branch: e.target.value })} />
              </Field>
              <Field label="Conta">
                <TextInput value={account.account ?? ""} onChange={(e) => updateAccount(index, { account: e.target.value })} />
              </Field>
              <div className="flex items-end">
                <Button type="button" variant="outline" onClick={() => patchFinancial({ refundBankAccounts: financial.refundBankAccounts.filter((_: any, i: number) => i !== index) })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Grid>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}