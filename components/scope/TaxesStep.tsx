"use client";

import type { EscopoForm } from "@/domain/scope/types";
import { Field, NumberInput, Select, TextInput } from "@/components/ui/form-fields";
import { Card, Grid, Stack } from "@/components/ui/form-layout";
import { DESTINATION_LABEL, OPERATION_LABEL, TAX_REGIME_LABEL, emptyOperationTaxes, type OperationType } from "./canonical-draft";

function AccountOwnerSelect({ value, onChange }: any) { return <Select value={value ?? "CASCO"} onChange={(e) => onChange(e.target.value)}><option value="CASCO">Conta CASCO</option><option value="CLIENT">Conta do cliente</option></Select>; }
function TaxRegimeSelect({ value, onChange }: any) { return <Select value={value ?? "FULL"} onChange={(e) => onChange(e.target.value)}>{Object.entries(TAX_REGIME_LABEL).map(([k,l])=><option key={k} value={k}>{l}</option>)}</Select>; }

export default function TaxesStep({ form, patchForm }: { form: EscopoForm; patchForm: (patch: Partial<EscopoForm>) => void; errors: Record<string, string> }) {
  const tabs = form.operations.types.length ? form.operations.types : ["IMPORT"];
  return <Stack>{tabs.map((operationType) => { const key = operationType === "IMPORT" ? "importTaxes" : "exportTaxes"; const taxes = (form.taxes as any)[key] ?? emptyOperationTaxes(); const icms = taxes.icms ?? emptyOperationTaxes().icms;
    const operation = operationType === 'IMPORT' ? form.operations.importOperation : form.operations.exportOperation;
    const destinations = operation?.destinationPurposes ?? [];
    const patchTaxes = (patch:any)=> patchForm({ taxes: { ...form.taxes, [key]: { ...taxes, ...patch } } } as Partial<EscopoForm>);
    return <Card key={operationType}><h3 className="text-base font-semibold">Impostos - {OPERATION_LABEL[operationType as OperationType]}</h3><Grid columns={2}><Field label="Conta impostos federais"><AccountOwnerSelect value={taxes.federalTaxes?.paymentAccountType} onChange={(v:string)=>patchTaxes({federalTaxes:{...taxes.federalTaxes,paymentAccountType:v}})} /></Field><Field label="Regime ICMS"><TaxRegimeSelect value={icms.regime} onChange={(v:string)=>patchTaxes({icms:{...icms,regime:v}})} /></Field></Grid>
      {operationType==='IMPORT' ? <div className="mt-4 grid gap-3">{destinations.map((d:any)=>{ const found=(icms.destinationRates??[]).find((r:any)=>r.destinationPurpose===d.purpose)??{destinationPurpose:d.purpose,collectedRate:null,effectiveRate:null,regime:icms.regime,notes:null}; const others=(icms.destinationRates??[]).filter((r:any)=>r.destinationPurpose!==d.purpose); const set=(patch:any)=>patchTaxes({icms:{...icms,destinationRates:[...others,{...found,...patch}]}}); return <Card key={d.purpose} className="p-3"><h4 className="font-medium">{DESTINATION_LABEL[d.purpose as keyof typeof DESTINATION_LABEL]}</h4><Grid columns={3}><Field label="Regime"><TaxRegimeSelect value={found.regime} onChange={(v:string)=>set({regime:v})} /></Field><Field label="Alíquota efetiva"><NumberInput value={found.effectiveRate ?? ""} onChange={(e)=>set({effectiveRate:e.target.value})} /></Field><Field label="Alíquota recolhida"><NumberInput value={found.collectedRate ?? ""} onChange={(e)=>set({collectedRate:e.target.value})} /></Field></Grid><Field label="Observação"><TextInput value={found.notes ?? ""} onChange={(e)=>set({notes:e.target.value})} /></Field></Card>})}</div>:null}
    </Card>})}</Stack>;
}
