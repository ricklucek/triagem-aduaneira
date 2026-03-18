"use client";

import { EscopoForm } from "@/domain/scope/types";
import ContaBancariaBlock from "./blocks/ContaBancariaBlock";
import { Checkbox, Field, Select, TextArea, TextInput } from "@/components/ui/form-fields";
import { Card, Grid, Section, Stack } from "@/components/ui/form-layout";

import { ResponsiblePicker } from "./ResponsiblePicker";
import type { ScopeResponsible } from "@/lib/api/types/scope-metadata";

type Props = {
  form: EscopoForm;
  errors: Record<string, string>;
  onChange: (next: EscopoForm) => void;
  responsaveis: ScopeResponsible[];
};

const ARMAZENS = [
  ["SANTOS_BANDEIRANTES_8931364", "Santos Bandeirantes"],
  ["SANTOS_MOVECTA_8933001", "Santos Movecta"],
  ["SANTOS_MULTILOG_8933201", "Santos Multilog"],
  ["SANTOS_EUDMARCO_8933202", "Santos Eudmarco"],
  ["VCP_8921101", "VCP"],
  ["GRU_8911101", "GRU"],
  ["CLIF_9983001", "CLIF"],
  ["PORTONAVE_9101602", "Portonave"],
  ["MULTILOG_ITAJAI_9103201", "Multilog Itajaí"],
  ["PACLOG_NAVEGANTES_9101102", "PacLog Navegantes"],
  ["PACLOG_CURITIBA_9991102", "PacLog Curitiba"],
  ["PS1_MULTILOG_CURITIBA_9993202", "PS1 Multilog Curitiba"],
  ["TCP_PARANAGUA_9801303", "TCP Paranaguá"],
  ["ROCHA_PARANAGUA_9801408", "Rocha Paranaguá"],
  ["TECON_SUAPE_4931303", "Tecon Suape"],
] as const;

const ANUENCIAS = [
  "ANVISA",
  "MAPA",
  "IBAMA",
  "DFPC",
  "DPF",
  "MARINHA_AERONAUTICA",
  "CTMSP_CNEN",
  "MDIC_SECEX",
  "BACEN",
  "RFB",
  "INMETRO",
  "CNPQ_MCTI",
  "ICMBIO",
  "ANP",
  "ANTT_ANTAQ_ANAC",
] as const;

export default function StepImportacao({ form, errors, onChange, responsaveis }: Props) {
  const data: NonNullable<EscopoForm["operacao"]["importacao"]> = form.operacao.importacao ?? {
    analistaDA: "",
    analistaAE: "",
    produtosImportados: "",
    ncms: [{ codigo: "", possuiNve: undefined }],
    vinculoComExportador: "NAO",
    locaisEntrada: [] as string[],
    outroLocalEntrada: "",
    armazensLiberacao: [] as string[],
    outroArmazemLiberacao: "",
    necessidadeDtcDta: "NAO",
    necessidadeLiLpco: "NAO",
    anuencias: [] as string[],
    impostosFederais: {
      contaPagamento: "CASCO",
      ii: { regime: "INTEGRAL", detalheBeneficio: "" },
      ipi: { regime: "INTEGRAL", detalheBeneficio: "" },
      pis: { regime: "INTEGRAL", detalheBeneficio: "" },
      cofins: { regime: "INTEGRAL", detalheBeneficio: "" },
    },
    afrmm: undefined,
    icms: { regime: "INTEGRAL", detalheBeneficio: "" },
    destinacao: "REVENDA",
    subtipoConsumo: null,
  } as NonNullable<EscopoForm["operacao"]["importacao"]>;

  function setData(next: NonNullable<EscopoForm["operacao"]["importacao"]>) {
    onChange({
      ...form,
      operacao: { ...form.operacao, importacao: next },
    });
  }

  function update(path: string, value: unknown) {
    const next = structuredClone(data);
    const keys = path.split(".");
    let ref: Record<string, unknown> = next as Record<string, unknown>;
    for (let i = 0; i < keys.length - 1; i++) {
      const nested = ref[keys[i]];
      if (typeof nested !== "object" || nested === null) return;
      ref = nested as Record<string, unknown>;
    }
    ref[keys[keys.length - 1]] = value;
    setData(next);
  }

  function toggleArrayValue(
    field: "locaisEntrada" | "armazensLiberacao" | "anuencias",
    value: string,
    checked: boolean
  ) {
    const current = new Set(data[field] as string[]);
    if (checked) current.add(value);
    else current.delete(value);
    update(field, Array.from(current));
  }

  return (
    <Stack>
      <Section title="Importação" description="Regras e parâmetros da operação de importação.">
        <Grid columns={2}>
          <ResponsiblePicker label="Analista DA" value={data.analistaDA} onChange={(value) => update("analistaDA", value)} options={responsaveis} error={errors["analistaDA"]} filterSetores={["Operação", "operacao", "Despacho Aduaneiro"]} />

          <ResponsiblePicker label="Analista AE" value={data.analistaAE} onChange={(value) => update("analistaAE", value)} options={responsaveis} error={errors["analistaAE"]} filterSetores={["Operação", "operacao", "Atendimento"]} />
        </Grid>

        <Field
          label="Produtos importados"
          hint="Campo opcional"
        >
          <TextArea
            value={data.produtosImportados ?? ""}
            onChange={(e) => update("produtosImportados", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="NCMs">
        <button
          type="button"
          onClick={() => update("ncms", [...data.ncms, { codigo: "", possuiNve: undefined }])}
        >
          + Adicionar NCM
        </button>

        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {data.ncms.map((item, index: number) => (
            <div
              key={index}
              style={{ border: "1px solid #eaecf0", borderRadius: 12, padding: 12 }}
            >
              <Grid columns={2}>
                <Field label={`NCM ${index + 1}`} required error={index === 0 ? errors["ncms"] : undefined}>
                  <TextInput
                    value={item.codigo}
                    onChange={(e) => {
                      const next = [...data.ncms];
                      next[index] = { ...next[index], codigo: e.target.value };
                      update("ncms", next);
                    }}
                  />
                </Field>

                <Field label="Possui NVE?" hint="Campo opcional">
                  <Select
                    value={item.possuiNve ?? ""}
                    onChange={(e) => {
                      const next = [...data.ncms];
                      next[index] = {
                        ...next[index],
                        possuiNve: (e.target.value == "SIM") ? "SIM" : (e.target.value == "NAO") ? "NAO" : undefined,
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

              {data.ncms.length > 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    update(
                      "ncms",
                      data.ncms.filter((_, i: number) => i !== index)
                    )
                  }
                >
                  Remover
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Parâmetros operacionais">
        <Grid columns={2}>
          <Field
            label="Importador tem vínculo com o exportador"
            required
            error={errors["vinculoComExportador"]}
          >
            <Select
              value={data.vinculoComExportador}
              onChange={(e) => update("vinculoComExportador", e.target.value)}
            >
              <option value="SIM">Sim</option>
              <option value="NAO">Não</option>
            </Select>
          </Field>

          <Field
            label="Necessidade de DTC/DTA"
            required
            error={errors["necessidadeDtcDta"]}
          >
            <Select
              value={data.necessidadeDtcDta}
              onChange={(e) => update("necessidadeDtcDta", e.target.value)}
            >
              <option value="DTC">DTC</option>
              <option value="DTA">DTA</option>
              <option value="NAO">Não</option>
            </Select>
          </Field>
        </Grid>
      </Section>

      <Section title="Locais de entrada">
        <Stack gap={10}>
          {ARMAZENS.map(([value, label]) => (
            <Checkbox
              key={value}
              label={label}
              checked={data.locaisEntrada.includes(value)}
              onChange={(checked) =>
                toggleArrayValue("locaisEntrada", value, checked)
              }
            />
          ))}
        </Stack>
      </Section>

      <Section title="Armazéns de liberação">
        <Stack gap={10}>
          {ARMAZENS.map(([value, label]) => (
            <Checkbox
              key={value}
              label={label}
              checked={data.armazensLiberacao.includes(value)}
              onChange={(checked) =>
                toggleArrayValue("armazensLiberacao", value, checked)
              }
            />
          ))}

          <Field
            label="Outro armazém de liberação"
            error={
              errors["armazensLiberacao"] || errors["outroArmazemLiberacao"]
            }
          >
            <TextInput
              value={data.outroArmazemLiberacao ?? ""}
              onChange={(e) =>
                update("outroArmazemLiberacao", e.target.value)
              }
            />
          </Field>
        </Stack>
      </Section>

      <Section title="LI / LPCO">
        <Field
          label="Necessidade de LI/LPCO"
          required
          error={errors["necessidadeLiLpco"]}
        >
          <Select
            value={data.necessidadeLiLpco}
            onChange={(e) => update("necessidadeLiLpco", e.target.value)}
          >
            <option value="SIM">Sim</option>
            <option value="NAO">Não</option>
          </Select>
        </Field>

        {data.necessidadeLiLpco === "SIM" ? (
          <Stack gap={10}>
            {ANUENCIAS.map((value) => (
              <Checkbox
                key={value}
                label={value}
                checked={data.anuencias.includes(value)}
                onChange={(checked) =>
                  toggleArrayValue("anuencias", value, checked)
                }
              />
            ))}
            {errors["anuencias"] ? (
              <div style={{ color: "#b42318", fontSize: 12 }}>
                {errors["anuencias"]}
              </div>
            ) : null}
          </Stack>
        ) : null}
      </Section>

      <Section title="Impostos Federais">
        <Grid columns={2}>
          <Field label="Conta para pagamento" required>
            <Select
              value={data.impostosFederais.contaPagamento}
              onChange={(e) =>
                update("impostosFederais.contaPagamento", e.target.value)
              }
            >
              <option value="CASCO">Casco</option>
              <option value="CLIENTE">Cliente</option>
            </Select>
          </Field>
        </Grid>

        {data.impostosFederais.contaPagamento === "CLIENTE" ? (
          <ContaBancariaBlock
            title="Conta do cliente"
            value={
              data.impostosFederais.dadosContaCliente ?? {
                banco: "",
                agencia: "",
                conta: "",
              }
            }
            onChange={(next) =>
              update("impostosFederais.dadosContaCliente", next)
            }
          />
        ) : null}

        {(["ii", "ipi", "pis", "cofins"] as const).map((tributo) => (
          <Card key={tributo}>
            <Grid columns={2}>
              <Field label={tributo.toUpperCase()} required>
                <Select
                  value={data.impostosFederais[tributo].regime}
                  onChange={(e) =>
                    update(`impostosFederais.${tributo}.regime`, e.target.value)
                  }
                >
                  <option value="INTEGRAL">Integral</option>
                  <option value="BENEFICIO">Benefício</option>
                </Select>
              </Field>

              {data.impostosFederais[tributo].regime === "BENEFICIO" ? (
                <Field
                  label={`Detalhe do benefício — ${tributo.toUpperCase()}`}
                  required
                  error={errors[`impostosFederais.${tributo}.detalheBeneficio`]}
                >
                  <TextInput
                    value={
                      data.impostosFederais[tributo].detalheBeneficio ?? ""
                    }
                    onChange={(e) =>
                      update(
                        `impostosFederais.${tributo}.detalheBeneficio`,
                        e.target.value
                      )
                    }
                  />
                </Field>
              ) : null}
            </Grid>
          </Card>
        ))}
      </Section>

      <Field label="AFRMM">
        <Select
          value={data.afrmm ? "SIM" : "NAO"}
          onChange={(e) =>
            update(
              "afrmm",
              e.target.value === "SIM"
                ? {
                  contaPagamento: "CASCO",
                  regime: "INTEGRAL",
                  detalheBeneficio: "",
                }
                : undefined
            )
          }
        >
          <option value="NAO">Não</option>
          <option value="SIM">Sim</option>
        </Select>
      </Field>

      <Section title={""}>
        <Card>
          <Grid columns={2}>
            <Field label="ICMS" required>
              <Select
                value={data.icms.regime}
                onChange={(e) =>
                  update(`icms.regime`, e.target.value)
                }
              >
                <option value="INTEGRAL">Integral</option>
                <option value="BENEFICIO">Benefício</option>
              </Select>
            </Field>

            {data.icms.regime === "BENEFICIO" ? (
              <Field
                label={`Detalhe do benefício — ICMS`}
                required
                error={errors[`icms.detalheBeneficio`]}
              >
                <TextInput
                  value={
                    data.icms.detalheBeneficio ?? ""
                  }
                  onChange={(e) =>
                    update(
                      `icms.detalheBeneficio`,
                      e.target.value
                    )
                  }
                />
              </Field>
            ) : null}
          </Grid>
        </Card>
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