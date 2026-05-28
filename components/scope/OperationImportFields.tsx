"use client";

import { Button } from "@/components/ui/button";
import { Checkbox, Field, Select, TextArea, TextInput } from "@/components/ui/form-fields";
import { Card, Stack } from "@/components/ui/form-layout";
import SearchableCheckboxMenu from "./blocks/SearchableCheckboxMenu";
import { formatNCM } from "@/utils/format";

const LOCAIS = [
  ["0917900/0917800|Curitiba/ Paranaguá", "0917900/0917800 • Curitiba/ Paranaguá"],
  ["0817800|Santos", "0817800 • Santos"],
  ["0927800|Itajaí/ Navegantes", "0927800 • Itajaí/ Navegantes"],
  ["0927700|Itapoá", "0927700 • Itapoá"],
] as const;

const DESTINATIONS = [
  { value: "RESALE", label: "Revenda" },
  { value: "INDUSTRIALIZATION", label: "Industrialização" },
  { value: "USE_AND_CONSUMPTION", label: "Uso e consumo" },
  { value: "FIXED_ASSET", label: "Ativo imobilizado" },
];

export default function OperationImportFields({ operation, patchOperation, errors, prefix }: any) {
  const options = LOCAIS.map(([value, label]) => ({ value, label }));
  const destinations = operation.destinationPurposes ?? [];

  const updateNcm = (index: number, patch: any) => {
    const next = [...(operation.ncms ?? [])];
    next[index] = { ...next[index], ...patch };
    patchOperation({ ncms: next });
  };

  return (
    <Stack>
      <Card>
        <h3 className="text-base font-semibold">NCM e benefícios</h3>
        <div className="grid gap-3">
          {(operation.ncms ?? []).map((item: any, index: number) => (
            <Card key={index} className="p-4">
              <div className="grid gap-3">
                <Field label={index === 0 ? "NCM principal" : `NCM ${index + 1}`}>
                  <TextInput value={formatNCM(item.code ?? "")} onChange={(e) => updateNcm(index, { code: e.target.value })} />
                </Field>
                <Field label="Possui benefício?">
                  <Select value={item.hasBenefit ? "true" : item.hasBenefit === false ? "false" : ""} onChange={(e) => updateNcm(index, { hasBenefit: e.target.value === "" ? null : e.target.value === "true", benefitDescription: e.target.value === "true" ? item.benefitDescription ?? "" : null })}>
                    <option value="">Selecione</option><option value="true">Sim</option><option value="false">Não</option>
                  </Select>
                </Field>
                {item.hasBenefit ? <Field label="Descrição do benefício"><TextInput value={item.benefitDescription ?? ""} onChange={(e) => updateNcm(index, { benefitDescription: e.target.value })} /></Field> : null}
                {(operation.ncms?.length ?? 0) > 1 ? <Button type="button" variant="destructive" onClick={() => patchOperation({ ncms: operation.ncms.filter((_: any, i: number) => i !== index) })}>Remover</Button> : null}
              </div>
            </Card>
          ))}
          <Button type="button" variant="outline" onClick={() => patchOperation({ ncms: [...(operation.ncms ?? []), { code: "", description: null, hasBenefit: null, benefitDescription: null }] })}>+ Adicionar NCM</Button>
          <Field label="Observação sobre NCMs"><TextArea value={operation.ncmNotes ?? ""} onChange={(e) => patchOperation({ ncmNotes: e.target.value })} /></Field>
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold">Parâmetros de importação</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Vínculo com exportador"><Select value={operation.hasExporterRelationship === true ? "true" : operation.hasExporterRelationship === false ? "false" : ""} onChange={(e) => patchOperation({ hasExporterRelationship: e.target.value === "" ? null : e.target.value === "true" })}><option value="">Selecione</option><option value="true">Sim</option><option value="false">Não</option></Select></Field>
          <Field label="Necessidade de DTA"><Select value={operation.requiresDta === true ? "true" : operation.requiresDta === false ? "false" : ""} onChange={(e) => patchOperation({ requiresDta: e.target.value === "" ? null : e.target.value === "true" })}><option value="">Selecione</option><option value="true">Sim</option><option value="false">Não</option></Select></Field>
          <Field label="Necessidade de DTC"><Select value={operation.requiresDtc === true ? "true" : operation.requiresDtc === false ? "false" : ""} onChange={(e) => patchOperation({ requiresDtc: e.target.value === "" ? null : e.target.value === "true" })}><option value="">Selecione</option><option value="true">Sim</option><option value="false">Não</option></Select></Field>
          <Field label="Necessidade de LI/LPCO"><Select value={operation.requiresLiLpco === true ? "true" : operation.requiresLiLpco === false ? "false" : ""} onChange={(e) => patchOperation({ requiresLiLpco: e.target.value === "" ? null : e.target.value === "true" })}><option value="">Selecione</option><option value="true">Sim</option><option value="false">Não</option></Select></Field>
        </div>
        <div className="mt-4 grid gap-4">
          <SearchableCheckboxMenu title="Locais de entrada" searchLabel="Pesquisar local" value={(operation.entryLocations ?? []).map((l: any) => l.rawValue ?? l.name)} options={options} onChange={(next) => patchOperation({ entryLocations: next.map((raw: string) => ({ type: "ENTRY", rawValue: raw, name: raw.includes("|") ? raw.split("|")[1] : raw, code: raw.includes("|") ? raw.split("|")[0] : null })) })} error={errors?.[`${prefix}.entryLocations`]} />
          <SearchableCheckboxMenu title="Locais de desembaraço" searchLabel="Pesquisar local" value={(operation.customsClearanceLocations ?? []).map((l: any) => l.rawValue ?? l.name)} options={options} onChange={(next) => patchOperation({ customsClearanceLocations: next.map((raw: string) => ({ type: "CUSTOMS_CLEARANCE", rawValue: raw, name: raw.includes("|") ? raw.split("|")[1] : raw, code: raw.includes("|") ? raw.split("|")[0] : null })) })} error={errors?.[`${prefix}.customsClearanceLocations`]} />
        </div>
      </Card>

      <Card><h3 className="text-base font-semibold">Destinação</h3><div className="grid gap-3">{DESTINATIONS.map((option) => { const selected = destinations.some((d: any) => d.purpose === option.value); return <div key={option.value} className="rounded-xl border p-3"><Checkbox label={option.label} checked={selected} onChange={(checked)=>patchOperation({destinationPurposes: checked?[...destinations,{purpose:option.value,consumptionSubtype:null}]:destinations.filter((d:any)=>d.purpose!==option.value)})}/>{selected && option.value==='USE_AND_CONSUMPTION'?<TextInput className="mt-2" placeholder="Subtipo de consumo" value={destinations.find((d:any)=>d.purpose===option.value)?.consumptionSubtype??""} onChange={(e)=>patchOperation({destinationPurposes:destinations.map((d:any)=>d.purpose===option.value?{...d,consumptionSubtype:e.target.value}:d)})}/>:null}</div>;})}</div></Card>
    </Stack>
  );
}
