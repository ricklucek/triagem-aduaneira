"use client";

import { EscopoForm } from "@/domain/scope/types";
import NcmListBlock from "./blocks/NcmListBlock";
import SearchableCheckboxMenu from "./blocks/SearchableCheckboxMenu";
import {
  Field,
  Select,
  TextArea,
} from "@/components/ui/form-fields";
import { Grid } from "@/components/ui/form-layout";
import { ResponsiblePicker } from "./ResponsiblePicker";
import type { ScopeResponsible } from "@/lib/api/types/scope-metadata";

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
  const data: NonNullable<EscopoForm["operacao"]["exportacao"]> =
    form.operacao.exportacao ?? {
    analistaDA: "",
    produtosExportados: "",
    ncms: [""],
    observacaoNcms: "",
    destinacao: [],
    subtipoConsumo: null,
  };
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

  return (
    <main className="flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        <Grid columns={2}>
          <ResponsiblePicker
            label="Analista DA"
            value={data.analistaDA}
            onChange={(value) => update("analistaDA", value)}
            options={responsaveis}
            error={errors["analistaDA"]}
          />
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

      <NcmListBlock
        items={data.ncms}
        onChange={(next) => update("ncms", next)}
        error={errors["ncms"]}
      />

      <Field label="Observações" hint="Campo opcional">
        <TextArea
          value={data.observacaoNcms ?? ""}
          onChange={(e) => update("observacaoNcms", e.target.value)}
        />
      </Field>
            
      <div className="flex flex-col gap-5">
        <Grid columns={2}>
          <Field label="Destinação" required>
            <SearchableCheckboxMenu
              title="Destinação"
              searchLabel="Pesquisar destinação"
              value={data.destinacao}
              options={[
                { value: "CONSUMO", label: "Consumo" },
                { value: "REVENDA", label: "Revenda" },
              ]}
              onChange={(next) => update("destinacao", next)}
              error={errors["destinacao"]}
            />
          </Field>
          {data.destinacao.includes("CONSUMO") ? (
            <Field
              label="Subtipo de consumo"
              required
              error={errors["subtipoConsumo"]}
            >
              <Select
                value={data.subtipoConsumo ?? ""}
                onChange={(e) => update("subtipoConsumo", e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="ATIVO_IMOBILIZADO_FIXO">
                  Ativo imobilizado/fixo
                </option>
                <option value="INSUMOS_PARA_INDUSTRIALIZACAO">
                  Insumos para industrialização
                </option>
                <option value="USO_E_CONSUMO">Uso e consumo</option>
              </Select>
            </Field>
          ) : null}
        </Grid>
      </div>
    </main>
  );
}
