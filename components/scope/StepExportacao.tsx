"use client";

import { EscopoForm } from "@/domain/scope/types";
import SearchableCheckboxMenu from "./blocks/SearchableCheckboxMenu";
import {
  Field,
  Select,
  TextArea,
  TextInput,
} from "@/components/ui/form-fields";
import { Card, Grid } from "@/components/ui/form-layout";
import { Button } from "../ui/button";
import { formatNCM } from "@/utils/format";

type Props = {
  form: EscopoForm;
  errors: Record<string, string>;
  onChange: (next: EscopoForm) => void;
};

export default function StepExportacao({
  form,
  errors,
  onChange,
}: Props) {
  const data: NonNullable<EscopoForm["operacao"]["exportacao"]> =
    form.operacao.exportacao ?? {
      produtosExportados: "",
      ncms: [{ codigo: "", possuiBeneficio: null, descricaoBeneficio: "" }],
      observacaoNcms: "",
      destinacao: [],
      subtipoConsumo: [],
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
                          value === "SIM"
                            ? next[index].descricaoBeneficio
                            : "",
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
              {data.ncms.length > 1 ? (
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
              ) : null}
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
              <SearchableCheckboxMenu
                title=""
                searchLabel="Pesquisar subtipo de consumo"
                value={data.subtipoConsumo}
                options={[
                  {
                    value: "ATIVO_IMOBILIZADO_FIXO",
                    label: "Ativo imobilizado/fixo",
                  },
                  {
                    value: "INSUMOS_PARA_INDUSTRIALIZACAO",
                    label: "Insumos para industrialização",
                  },
                  { value: "USO_E_CONSUMO", label: "Uso e consumo" },
                ]}
                onChange={(next) => update("subtipoConsumo", next)}
                error={errors["subtipoConsumo"]}
              />
            </Field>
          ) : null}
        </Grid>
      </div>
    </main>
  );
}
