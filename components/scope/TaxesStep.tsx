"use client";

import type { EscopoForm } from "@/domain/scope/types";

import { Field, Select, TextInput } from "@/components/ui/form-fields";
import { Card, Grid, Stack } from "@/components/ui/form-layout";

import {
  OPERATION_LABEL,
  TAX_REGIME_LABEL,
  emptyOperationTaxes,
  type OperationType,
} from "./canonical-draft";


function fieldError(errors: Record<string, string>, ...paths: string[]) {
  for (const path of paths) {
    if (errors[path]) return errors[path];
  }
  return undefined;
}

function AccountOwnerSelect({ value, onChange }: { value?: string | null; onChange: (value: string) => void }) {
  return (
    <Select value={value ?? "CASCO"} onChange={(e) => onChange(e.target.value)}>
      <option value="CASCO">Conta CASCO</option>
      <option value="CLIENT">Conta do cliente</option>
    </Select>
  );
}

function TaxRegimeSelect({ value, onChange }: { value?: string | null; onChange: (value: string) => void }) {
  return (
    <Select value={value ?? "FULL"} onChange={(e) => onChange(e.target.value)}>
      {Object.entries(TAX_REGIME_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
    </Select>
  );
}


export default function TaxesStep({ form, patchForm, errors }: { form: EscopoForm; patchForm: (patch: Partial<EscopoForm>) => void; errors: Record<string, string> }) {
  const tabs = form.operations.types.length ? form.operations.types : ["IMPORT"];
  return (
    <Stack>
      {tabs.map((operationType) => {
        const key = operationType === "IMPORT" ? "importTaxes" : "exportTaxes";
        const taxes = (form.taxes as any)[key] ?? emptyOperationTaxes();
        const federal = taxes.federalTaxes ?? emptyOperationTaxes().federalTaxes;
        const afrmm = taxes.afrmm ?? emptyOperationTaxes().afrmm;
        const icms = taxes.icms ?? emptyOperationTaxes().icms;

        function patchTaxes(patch: any) {
          patchForm({ taxes: { ...form.taxes, [key]: { ...taxes, ...patch } } } as Partial<EscopoForm>);
        }

        return (
          <Card key={operationType}>
            <h3 className="text-base font-semibold">Impostos - {OPERATION_LABEL[operationType as OperationType]}</h3>
            <Grid columns={2}>
              <Field label="Conta impostos federais">
                <AccountOwnerSelect value={federal.paymentAccountType} onChange={(paymentAccountType) => patchTaxes({ federalTaxes: { ...federal, paymentAccountType } })} />
              </Field>
              <Field label="Observação impostos federais">
                <TextInput value={federal.notes ?? ""} onChange={(e) => patchTaxes({ federalTaxes: { ...federal, notes: e.target.value } })} />
              </Field>
              {(["ii", "ipi", "pis", "cofins"] as const).map((tax) => {
                const regimeKey = `${tax}Regime`;
                const benefitKey = `${tax}BenefitDetail`;
                return (
                  <div key={tax} className="rounded-xl border p-3">
                    <Field label={tax.toUpperCase()}>
                      <TaxRegimeSelect value={(federal as any)[regimeKey]} onChange={(value) => patchTaxes({ federalTaxes: { ...federal, [regimeKey]: value } })} />
                    </Field>
                    <Field label={`Benefício ${tax.toUpperCase()}`}>
                      <TextInput value={(federal as any)[benefitKey] ?? ""} onChange={(e) => patchTaxes({ federalTaxes: { ...federal, [benefitKey]: e.target.value } })} />
                    </Field>
                  </div>
                );
              })}
              <Field label="Regime AFRMM">
                <TaxRegimeSelect value={afrmm.regime} onChange={(regime) => patchTaxes({ afrmm: { ...afrmm, regime } })} />
              </Field>
              <Field label="Detalhe benefício AFRMM">
                <TextInput value={afrmm.benefitDetail ?? ""} onChange={(e) => patchTaxes({ afrmm: { ...afrmm, benefitDetail: e.target.value } })} />
              </Field>
              <Field label="Regime ICMS">
                <TaxRegimeSelect value={icms.regime} onChange={(regime) => patchTaxes({ icms: { ...icms, regime } })} />
              </Field>
              <Field label="Observação ICMS">
                <TextInput value={icms.notes ?? ""} onChange={(e) => patchTaxes({ icms: { ...icms, notes: e.target.value } })} />
              </Field>
            </Grid>
            {fieldError(errors, `taxes.${key}`) ? <p className="mt-2 text-sm text-destructive">{fieldError(errors, `taxes.${key}`)}</p> : null}
          </Card>
        );
      })}
    </Stack>
  );
}