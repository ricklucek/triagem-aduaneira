"use client";

import { EscopoForm } from "@/domain/scope/types";
import NcmListBlock from "./blocks/NcmListBlock";
import { Checkbox, Field, Select, TextArea, TextInput } from "@/components/ui/form-fields";
import { Grid, Section, Stack } from "@/components/ui/form-layout";

type Props = {
  form: EscopoForm;
  errors: Record<string, string>;
  onChange: (next: EscopoForm) => void;
};

const PORTOS = [
  ["FOZ_DO_IGUACU", "Foz do Iguaçu"],
  ["URUGUAIANA", "Uruguaiana"],
  ["JAGUARAO", "Jaguarão"],
  ["CHUI", "Chuí"],
  ["CORUMBA", "Corumbá"],
] as const;

export default function StepExportacao({ form, errors, onChange }: Props) {
  const data =
    form.operacao.exportacao ?? {
      analistaDA: "",
      analistaAE: "",
      produtosExportados: "",
      ncms: [""],
      portosFronteiras: [],
      outroPorto: "",
      outraFronteira: "",
      destinacao: "REVENDA",
      subtipoConsumo: null,
    };

  function setData(next: any) {
    onChange({
      ...form,
      operacao: { ...form.operacao, exportacao: next },
    });
  }

  function update(path: string, value: any) {
    const next = structuredClone(data as any);
    const keys = path.split(".");
    let ref = next;
    for (let i = 0; i < keys.length - 1; i++) ref = ref[keys[i]];
    ref[keys[keys.length - 1]] = value;
    setData(next);
  }

  function togglePorto(value: "FOZ_DO_IGUACU" | "URUGUAIANA" | "JAGUARAO" | "CHUI" | "CORUMBA", checked: boolean) {
    const current = new Set(data.portosFronteiras);
    if (checked) current.add(value);
    else current.delete(value);
    update("portosFronteiras", Array.from(current));
  }

  return (
    <Stack>
      <Section title="Exportação" description="Regras e parâmetros da operação de exportação.">
        <Grid columns={2}>
          <Field label="Analista DA" required error={errors["analistaDA"]}>
            <TextInput
              value={data.analistaDA}
              onChange={(e) => update("analistaDA", e.target.value)}
            />
          </Field>

          <Field label="Analista AE" required error={errors["analistaAE"]}>
            <TextInput
              value={data.analistaAE}
              onChange={(e) => update("analistaAE", e.target.value)}
            />
          </Field>
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
      </Section>

      <NcmListBlock
        items={data.ncms}
        onChange={(next) => update("ncms", next)}
        error={errors["ncms"]}
      />

      <Section title="Portos e fronteiras de liberação">
        <Stack gap={10}>
          {PORTOS.map(([value, label]) => (
            <Checkbox
              key={value}
              label={label}
              checked={data.portosFronteiras.includes(value)}
              onChange={(checked) => togglePorto(value, checked)}
            />
          ))}

          <Grid columns={2}>
            <Field label="Outro porto">
              <TextInput
                value={data.outroPorto ?? ""}
                onChange={(e) => update("outroPorto", e.target.value)}
              />
            </Field>

            <Field label="Outra fronteira">
              <TextInput
                value={data.outraFronteira ?? ""}
                onChange={(e) => update("outraFronteira", e.target.value)}
              />
            </Field>
          </Grid>

          {errors["portosFronteiras"] ? (
            <div style={{ color: "#b42318", fontSize: 12 }}>
              {errors["portosFronteiras"]}
            </div>
          ) : null}
        </Stack>
      </Section>

      <Section title="Destinação">
        <Grid columns={2}>
          <Field label="Destinação" required>
            <Select
              value={data.destinacao}
              onChange={(e) => update("destinacao", e.target.value)}
            >
              <option value="REVENDA">Revenda</option>
              <option value="CONSUMO">Consumo</option>
            </Select>
          </Field>

          {data.destinacao === "CONSUMO" ? (
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
      </Section>
    </Stack>
  );
}