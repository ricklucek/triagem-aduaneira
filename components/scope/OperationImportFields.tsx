"use client";

import type { OperationDraft } from "@/domain/scope/schema";

import { Checkbox, Field, Select } from "@/components/ui/form-fields";
import { Card, Grid, Stack } from "@/components/ui/form-layout";

import SearchableCheckboxMenu from "./blocks/SearchableCheckboxMenu";
import OperationNcmSection from "./OperationNcmSection";

type OperationNcm = OperationDraft["ncms"][number];
type OperationLocation = OperationDraft["entryLocations"][number];
type DestinationPurpose = OperationDraft["destinationPurposes"][number]["purpose"];
type DestinationPurposeItem = OperationDraft["destinationPurposes"][number];

type OperationImportFieldsProps = {
  operation: OperationDraft;
  patchOperation: (patch: Partial<OperationDraft>) => void;
  errors: Record<string, string>;
  prefix: string;
};

const LOCAIS = [
  ["0917900/0917800|Curitiba/ Paranaguá", "0917900/0917800 • Curitiba/ Paranaguá"],
  ["0817800|Santos", "0817800 • Santos"],
  ["0927800|Itajaí/ Navegantes", "0927800 • Itajaí/ Navegantes"],
  ["0927700|Itapoá", "0927700 • Itapoá"],
] as const;

const DESTINATION_OPTIONS: ReadonlyArray<{ value: DestinationPurpose; label: string }> = [
  { value: "RESALE", label: "Revenda" },
  { value: "INDUSTRIALIZATION", label: "Industrialização" },
  { value: "USE_AND_CONSUMPTION", label: "Uso e consumo" },
  { value: "FIXED_ASSET", label: "Ativo imobilizado" },
  { value: "CONSUMPTION", label: "Consumo" },
];

const CONSUMPTION_SUBTYPE_OPTIONS = [
  { value: "ATIVO_IMOBILIZADO_FIXO", label: "Ativo imobilizado/fixo" },
  { value: "INSUMOS_PARA_INDUSTRIALIZACAO", label: "Insumos para industrialização" },
  { value: "USO_E_CONSUMO", label: "Uso e consumo" },
] as const;

function booleanSelectValue(value: boolean | null | undefined) {
  if (value === true) return "true";
  if (value === false) return "false";
  return "";
}

function booleanFromSelect(value: string) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function parseLocation(rawValue: string, type: OperationLocation["type"]): OperationLocation {
  const [code, name] = rawValue.includes("|") ? rawValue.split("|") : [null, rawValue];

  return {
    type,
    rawValue,
    code,
    name,
  };
}

function locationValue(location: OperationLocation) {
  return location.rawValue ?? [location.code, location.name].filter(Boolean).join("|");
}

export default function OperationImportFields({
  operation,
  patchOperation,
  errors,
  prefix,
}: OperationImportFieldsProps) {
  const locationOptions = LOCAIS.map(([value, label]) => ({ value, label }));
  const destinations = operation.destinationPurposes ?? [];
  const consumptionDestination = destinations.find((item) => item.purpose === "CONSUMPTION");

  function patchDestinations(next: DestinationPurposeItem[]) {
    patchOperation({ destinationPurposes: next });
  }

  function toggleDestination(purpose: DestinationPurpose, checked: boolean) {
    if (checked) {
      patchDestinations([
        ...destinations,
        {
          purpose,
          consumptionSubtype: null,
          consumptionSubtypes: [],
        },
      ]);
      return;
    }

    patchDestinations(destinations.filter((item) => item.purpose !== purpose));
  }

  function updateConsumptionSubtypes(next: string[]) {
    const updated = destinations.map((item) =>
      item.purpose === "CONSUMPTION"
        ? {
            ...item,
            consumptionSubtype: next[0] ?? null,
            consumptionSubtypes: next,
          }
        : item,
    );

    patchDestinations(updated);
  }

  return (
    <Stack>
      <Card>
        <h3 className="text-base font-semibold">NCM e benefícios</h3>
        <OperationNcmSection
          ncms={operation.ncms ?? []}
          ncmNotes={operation.ncmNotes}
          onChangeNcms={(next: OperationNcm[]) => patchOperation({ ncms: next })}
          onChangeNotes={(next) => patchOperation({ ncmNotes: next })}
          error={errors[`${prefix}.ncms`]}
        />
      </Card>

      <Card>
        <h3 className="text-base font-semibold">Parâmetros de importação</h3>
        <Grid columns={2}>
          <Field label="Vínculo com exportador" required error={errors[`${prefix}.hasExporterRelationship`]}>
            <Select
              value={booleanSelectValue(operation.hasExporterRelationship)}
              onChange={(event) => patchOperation({ hasExporterRelationship: booleanFromSelect(event.target.value) })}
            >
              <option value="">Selecione</option>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </Select>
          </Field>

          <Field label="Necessidade de DTA" required error={errors[`${prefix}.requiresDta`]}>
            <Select
              value={booleanSelectValue(operation.requiresDta)}
              onChange={(event) => patchOperation({ requiresDta: booleanFromSelect(event.target.value) })}
            >
              <option value="">Selecione</option>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </Select>
          </Field>

          <Field label="Necessidade de DTC" required error={errors[`${prefix}.requiresDtc`]}>
            <Select
              value={booleanSelectValue(operation.requiresDtc)}
              onChange={(event) => patchOperation({ requiresDtc: booleanFromSelect(event.target.value) })}
            >
              <option value="">Selecione</option>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </Select>
          </Field>

          <Field label="Necessidade de LI/LPCO" required error={errors[`${prefix}.requiresLiLpco`]}>
            <Select
              value={booleanSelectValue(operation.requiresLiLpco)}
              onChange={(event) => patchOperation({ requiresLiLpco: booleanFromSelect(event.target.value) })}
            >
              <option value="">Selecione</option>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </Select>
          </Field>
        </Grid>

        <SearchableCheckboxMenu
          title="Locais de entrada"
          searchLabel="Pesquisar local"
          value={(operation.entryLocations ?? []).map(locationValue)}
          options={locationOptions}
          onChange={(next) => patchOperation({ entryLocations: next.map((rawValue) => parseLocation(rawValue, "ENTRY")) })}
          error={errors[`${prefix}.entryLocations`]}
        />

        <SearchableCheckboxMenu
          title="Locais de desembaraço"
          searchLabel="Pesquisar local"
          value={(operation.customsClearanceLocations ?? []).map(locationValue)}
          options={locationOptions}
          onChange={(next) =>
            patchOperation({
              customsClearanceLocations: next.map((rawValue) => parseLocation(rawValue, "CUSTOMS_CLEARANCE")),
            })
          }
          error={errors[`${prefix}.customsClearanceLocations`]}
        />
      </Card>

      <Card>
        <h3 className="text-base font-semibold">Destinação</h3>
        <div className="grid gap-3">
          {DESTINATION_OPTIONS.map((option) => {
            const selected = destinations.some((item) => item.purpose === option.value);

            return (
              <Checkbox
                key={option.value}
                label={option.label}
                checked={selected}
                onChange={(checked) => toggleDestination(option.value, checked)}
              />
            );
          })}
        </div>

        {consumptionDestination ? (
          <Field
            label="Subtipo de consumo"
            required
            error={errors[`${prefix}.destinationPurposes.consumptionSubtypes`]}
          >
            <SearchableCheckboxMenu
              title=""
              searchLabel="Pesquisar subtipo de consumo"
              value={consumptionDestination.consumptionSubtypes ?? []}
              options={CONSUMPTION_SUBTYPE_OPTIONS}
              onChange={updateConsumptionSubtypes}
              error={errors[`${prefix}.destinationPurposes.consumptionSubtypes`]}
            />
          </Field>
        ) : null}
      </Card>
    </Stack>
  );
}
