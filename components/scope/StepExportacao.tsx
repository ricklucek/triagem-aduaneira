"use client";

import { useMemo } from "react";
import { EscopoForm } from "@/domain/scope/types";
import {
  Field,
  Select,
  TextArea,
  TextInput,
} from "@/components/ui/form-fields";
import { Card, Grid } from "@/components/ui/form-layout";
import { Button } from "../ui/button";
import { formatNCM } from "@/utils/format";
import { ResponsiblePicker } from "./ResponsiblePicker";
import { ScopeResponsible } from "@/lib/api/types/scope-metadata";
import SearchableCheckboxMenu from "./blocks/SearchableCheckboxMenu";
import { usePrepostosLookup } from "@/lib/api/hooks/use-dashboards";
import {
  buildExportUrfLocations,
  filterUrfLocationsByModal,
  MODAIS_LOCAL,
} from "@/domain/scope/locations";

type Props = {
  form: EscopoForm;
  errors: Record<string, string>;
  onChange: (next: EscopoForm) => void;
  responsaveis: ScopeResponsible[];
};

export default function StepExportacao({
  form,
  errors,
  onChange,
  responsaveis,
}: Props) {
  const {
    data: prepostos,
    isLoading: loadingPrepostos,
    error: prepostosError,
  } = usePrepostosLookup({ operacao: "EXPORTACAO" });
  const data: NonNullable<EscopoForm["operacao"]["exportacao"]> = form.operacao
    .exportacao ?? {
    produtosExportados: "",
    ncms: [{ codigo: "", possuiBeneficio: null, descricaoBeneficio: "" }],
    observacaoNcms: "",
    analistaDA: [""],
    analistaAE: [],
    destinacao: [],
    subtipoConsumo: [],
    modaisSaida: [],
    urfsDespacho: [],
    outraUrfDespacho: "",
    urfsEmbarque: [],
    outraUrfEmbarque: "",
  };
  const exportUrfLocations = useMemo(
    () => buildExportUrfLocations(prepostos?.items ?? []),
    [prepostos?.items],
  );
  const visibleUrfLocations = useMemo(
    () => filterUrfLocationsByModal(exportUrfLocations, data.modaisSaida),
    [data.modaisSaida, exportUrfLocations],
  );
  const urfOptions = visibleUrfLocations.map(({ value, label }) => ({
    value,
    label,
  }));
  function setData(next: NonNullable<EscopoForm["operacao"]["exportacao"]>) {
    onChange({ ...form, operacao: { ...form.operacao, exportacao: next } });
  }
  function update(path: string, value: unknown) {
    const next = structuredClone(data) as Record<string, unknown>;
    const keys = path.split(".");
    let ref = next;
    for (let i = 0; i < keys.length - 1; i++) {
      ref = ref[keys[i]] as Record<string, unknown>;
    }
    ref[keys[keys.length - 1]] = value;
    setData(next as NonNullable<EscopoForm["operacao"]["exportacao"]>);
  }

  function updateModaisSaida(next: string[]) {
    const knownValues = new Set(
      exportUrfLocations.map((location) => location.value),
    );
    const allowedValues = new Set(
      filterUrfLocationsByModal(exportUrfLocations, next).map(
        (location) => location.value,
      ),
    );
    setData({
      ...data,
      modaisSaida: next as NonNullable<
        EscopoForm["operacao"]["exportacao"]
      >["modaisSaida"],
      urfsDespacho: (data.urfsDespacho ?? []).filter(
        (value) => !knownValues.has(value) || allowedValues.has(value),
      ),
      urfsEmbarque: (data.urfsEmbarque ?? []).filter(
        (value) => !knownValues.has(value) || allowedValues.has(value),
      ),
    });
  }

  return (
    <main className="flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        <Grid columns={1}>
          <div className="flex flex-col gap-5">
            {data.analistaDA.map((analista, index) => (
              <div className="relative" key={`da-${index}`}>
                <ResponsiblePicker
                  label={`Analista DA ${index + 1}`}
                  value={analista}
                  onChange={(value) => {
                    const next = [...data.analistaDA];
                    next[index] = value;
                    update("analistaDA", next);
                  }}
                  options={responsaveis}
                  error={index === 0 ? errors["analistaDA"] : undefined}
                  onRemove={() => {
                    const next = [...data.analistaDA];
                    next.splice(index, 1);
                    update("analistaDA", next);
                  }}
                  removeButton={index > 0}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => update("analistaDA", [...data.analistaDA, ""])}
            >
              + Analista DA
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {(data.analistaAE ?? []).map((analista, index) => (
              <div className="relative" key={`ae-${index}`}>
                <ResponsiblePicker
                  label={`Analista AE ${index + 1}`}
                  value={analista}
                  onChange={(value) => {
                    const next = [...(data.analistaAE ?? [])];
                    next[index] = value;
                    update("analistaAE", next);
                  }}
                  options={responsaveis}
                  onRemove={() => {
                    const next = [...data.analistaAE];
                    next.splice(index, 1);
                    update("analistaAE", next);
                  }}
                  removeButton={true}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                update("analistaAE", [...(data.analistaAE ?? []), ""])
              }
            >
              + Analista AE
            </Button>
          </div>
        </Grid>

        <Field
          label="Principais produtos exportados"
          required
          error={errors["produtosExportados"]}
        >
          <TextArea
            value={data.produtosExportados}
            onChange={(e) => update("produtosExportados", e.target.value)}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-5">
        <p className="text-sm text-muted-foreground sm:text-base">
          Locais brasileiros da operação. Os campos abaixo são opcionais e
          combinam as localidades atendidas pela Casco com as localidades ativas
          dos prepostos de exportação.
        </p>

        <SearchableCheckboxMenu
          title="Modal de saída"
          searchLabel="Pesquisar modal"
          value={data.modaisSaida ?? []}
          options={MODAIS_LOCAL}
          onChange={updateModaisSaida}
          allowCustomOption={false}
          error={errors["modaisSaida"]}
        />

        <SearchableCheckboxMenu
          title="URF de despacho"
          searchLabel="Pesquisar URF de despacho"
          value={data.urfsDespacho ?? []}
          options={urfOptions}
          onChange={(next) => update("urfsDespacho", next)}
          customValue={data.outraUrfDespacho ?? ""}
          onCustomValueChange={(next) => update("outraUrfDespacho", next)}
          customLabel="Outra URF de despacho"
          error={errors["urfsDespacho"] || errors["outraUrfDespacho"]}
        />

        <SearchableCheckboxMenu
          title="URF de embarque/saída"
          searchLabel="Pesquisar URF de embarque/saída"
          value={data.urfsEmbarque ?? []}
          options={urfOptions}
          onChange={(next) => update("urfsEmbarque", next)}
          customValue={data.outraUrfEmbarque ?? ""}
          onCustomValueChange={(next) => update("outraUrfEmbarque", next)}
          customLabel="Outra URF de embarque/saída"
          error={errors["urfsEmbarque"] || errors["outraUrfEmbarque"]}
        />

        {loadingPrepostos ? (
          <p className="text-xs text-muted-foreground">
            Carregando localidades dos prepostos...
          </p>
        ) : null}
        {prepostosError ? (
          <p className="text-xs text-destructive">
            Não foi possível carregar as localidades dos prepostos. As
            localidades da Casco continuam disponíveis.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-5">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            update("ncms", [
              ...data.ncms,
              { codigo: "", possuiBeneficio: null, descricaoBeneficio: "" },
            ])
          }
        >
          + Adicionar NCM
        </Button>
        <div className="grid gap-3">
          {data.ncms.map((item, index) => (
            <Card key={index} className="gap-4 p-4">
              <Grid columns={2}>
                <Field
                  label={index === 0 ? "NCM principal" : `NCM ${index + 1}`}
                  required
                  error={index === 0 ? errors["ncms"] : undefined}
                >
                  <TextInput
                    value={formatNCM(item.codigo ?? "")}
                    onChange={(e) => {
                      const next = [...data.ncms];
                      next[index] = { ...next[index], codigo: e.target.value };
                      update("ncms", next);
                    }}
                  />
                </Field>
                <Field label="Possui benefício?" required>
                  <Select
                    value={item.possuiBeneficio ?? ""}
                    onChange={(e) => {
                      const value =
                        e.target.value === "SIM" || e.target.value === "NAO"
                          ? e.target.value
                          : null;
                      const next = [...data.ncms];
                      next[index] = {
                        ...next[index],
                        possuiBeneficio: value,
                        descricaoBeneficio:
                          value === "SIM" ? next[index].descricaoBeneficio : "",
                      };
                      update("ncms", next);
                    }}
                  >
                    <option value="">Selecione</option>
                    <option value="SIM">Sim</option>
                    <option value="NAO">Não</option>
                  </Select>
                </Field>
              </Grid>
              {item.possuiBeneficio === "SIM" ? (
                <Field label="Descrição do benefício">
                  <TextInput
                    value={item.descricaoBeneficio ?? ""}
                    onChange={(e) => {
                      const next = [...data.ncms];
                      next[index] = {
                        ...next[index],
                        descricaoBeneficio: e.target.value,
                      };
                      update("ncms", next);
                    }}
                  />
                </Field>
              ) : null}
              <Button
                type="button"
                variant="destructive"
                onClick={() =>
                  update(
                    "ncms",
                    data.ncms.filter((_, i) => i !== index),
                  )
                }
              >
                Remover
              </Button>
            </Card>
          ))}
          <Field label="Observações" hint="Campo opcional">
            <TextArea
              value={data.observacaoNcms ?? ""}
              onChange={(e) => update("observacaoNcms", e.target.value)}
            />
          </Field>
        </div>
      </div>

      <Field label="Observações" hint="Campo opcional">
        <TextArea
          value={data.observacaoNcms ?? ""}
          onChange={(e) => update("observacaoNcms", e.target.value)}
        />
      </Field>
    </main>
  );
}
