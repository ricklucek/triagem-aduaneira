"use client";

import { EscopoForm } from "@/domain/scope/types";
import ContaBancariaBlock from "./blocks/ContaBancariaBlock";
import NcmListBlock from "./blocks/NcmListBlock";
import { Checkbox, Field, Select, TextArea, TextInput } from "@/components/ui/form-fields";
import { Card, Grid, Section, Stack } from "@/components/ui/form-layout";

type Props = {
  form: EscopoForm;
  errors: Record<string, string>;
  onChange: (next: EscopoForm) => void;
};

const LOCAIS_ENTRADA = [
  ["PARANAGUA_0917800", "Paranaguá"],
  ["CURITIBA_0917900", "Curitiba"],
  ["SANTOS_0817800", "Santos"],
  ["VIRACOPOS_0817700", "Viracopos"],
  ["SALVADOR_0517800", "Salvador"],
  ["RIO_0717700", "Rio de Janeiro"],
  ["SUAPE_0417902", "Suape"],
] as const;

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

export default function StepImportacao({ form, errors, onChange }: Props) {
  const data =
    form.operacao.importacao ?? {
      analistaDA: "ANNA",
      analistaAE: "KAROL",
      produtosImportados: "",
      ncms: [""],
      vinculoComExportador: "NAO",
      locaisEntrada: [],
      outroLocalEntrada: "",
      armazensLiberacao: [],
      outroArmazemLiberacao: "",
      necessidadeDtcDta: "NAO",
      necessidadeLiLpco: "NAO",
      anuencias: [],
      impostosFederais: {
        contaPagamento: "CASCO",
        ii: { regime: "INTEGRAL", detalheBeneficio: "" },
        ipi: { regime: "INTEGRAL", detalheBeneficio: "" },
        pis: { regime: "INTEGRAL", detalheBeneficio: "" },
        cofins: { regime: "INTEGRAL", detalheBeneficio: "" },
      },
      afrmm: {
        contaPagamento: "CASCO",
        regime: "INTEGRAL",
        detalheBeneficio: "",
      },
      icms: {
        contaPagamento: "CASCO",
        regime: "INTEGRAL",
        recolhida: "",
        efetiva: "",
      },
      destinacao: "REVENDA",
      subtipoConsumo: null,
    };

  function setData(next: any) {
    onChange({
      ...form,
      operacao: { ...form.operacao, importacao: next },
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

  function toggleArrayValue(
    field: "locaisEntrada" | "armazensLiberacao" | "anuencias",
    value: string,
    checked: boolean
  ) {
    const current = new Set((data as any)[field] as string[]);
    if (checked) current.add(value);
    else current.delete(value);
    update(field, Array.from(current));
  }

  return (
    <Stack>
      <Section title="Importação" description="Regras e parâmetros da operação de importação.">
        <Grid columns={2}>
          <Field label="Analista DA" required error={errors["analistaDA"]}>
            <Select
              value={data.analistaDA}
              onChange={(e) => update("analistaDA", e.target.value)}
            >
              <option value="ANNA">Anna</option>
              <option value="CLEVERSON">Cleverson</option>
              <option value="MARCUS">Marcus</option>
              <option value="GILMARA">Gilmara</option>
              <option value="THEILA">Theila</option>
            </Select>
          </Field>

          <Field label="Analista AE" required error={errors["analistaAE"]}>
            <Select
              value={data.analistaAE}
              onChange={(e) => update("analistaAE", e.target.value)}
            >
              <option value="KAROL">Karol</option>
              <option value="LAYSA">Laysa</option>
              <option value="ANTONIO">Antonio</option>
              <option value="JONATHAN">Jonathan</option>
            </Select>
          </Field>
        </Grid>

        <Field
          label="Produtos importados"
          required
          error={errors["produtosImportados"]}
        >
          <TextArea
            value={data.produtosImportados}
            onChange={(e) => update("produtosImportados", e.target.value)}
          />
        </Field>
      </Section>

      <NcmListBlock
        items={data.ncms}
        onChange={(next) => update("ncms", next)}
        error={errors["ncms"]}
      />

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
          {LOCAIS_ENTRADA.map(([value, label]) => (
            <Checkbox
              key={value}
              label={label}
              checked={data.locaisEntrada.includes(value)}
              onChange={(checked) =>
                toggleArrayValue("locaisEntrada", value, checked)
              }
            />
          ))}

          <Field
            label="Outro local de entrada"
            error={errors["locaisEntrada"] || errors["outroLocalEntrada"]}
          >
            <TextInput
              value={data.outroLocalEntrada ?? ""}
              onChange={(e) => update("outroLocalEntrada", e.target.value)}
            />
          </Field>
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

      <Section title="AFRMM">
        <Grid columns={2}>
          <Field label="Conta para pagamento" required>
            <Select
              value={data.afrmm.contaPagamento}
              onChange={(e) => update("afrmm.contaPagamento", e.target.value)}
            >
              <option value="CASCO">Casco</option>
              <option value="CLIENTE">Cliente</option>
            </Select>
          </Field>

          <Field label="Regime" required>
            <Select
              value={data.afrmm.regime}
              onChange={(e) => update("afrmm.regime", e.target.value)}
            >
              <option value="INTEGRAL">Integral</option>
              <option value="BENEFICIO">Benefício</option>
            </Select>
          </Field>
        </Grid>

        {data.afrmm.contaPagamento === "CLIENTE" ? (
          <ContaBancariaBlock
            title="Conta do cliente"
            value={data.afrmm.dadosContaCliente ?? { banco: "", agencia: "", conta: "" }}
            onChange={(next) => update("afrmm.dadosContaCliente", next)}
          />
        ) : null}

        {data.afrmm.regime === "BENEFICIO" ? (
          <Field
            label="Detalhe do benefício"
            required
            error={errors["afrmm.detalheBeneficio"]}
          >
            <TextInput
              value={data.afrmm.detalheBeneficio ?? ""}
              onChange={(e) => update("afrmm.detalheBeneficio", e.target.value)}
            />
          </Field>
        ) : null}
      </Section>

      <Section title="ICMS">
        <Grid columns={2}>
          <Field label="Conta para pagamento" required>
            <Select
              value={data.icms.contaPagamento}
              onChange={(e) => update("icms.contaPagamento", e.target.value)}
            >
              <option value="CASCO">Casco</option>
              <option value="CLIENTE">Cliente</option>
            </Select>
          </Field>

          <Field label="Regime" required>
            <Select
              value={data.icms.regime}
              onChange={(e) => update("icms.regime", e.target.value)}
            >
              <option value="INTEGRAL">Integral</option>
              <option value="BENEFICIO">Benefício</option>
            </Select>
          </Field>
        </Grid>

        {data.icms.contaPagamento === "CLIENTE" ? (
          <ContaBancariaBlock
            title="Conta do cliente"
            value={data.icms.dadosContaCliente ?? { banco: "", agencia: "", conta: "" }}
            onChange={(next) => update("icms.dadosContaCliente", next)}
          />
        ) : null}

        {data.icms.regime === "BENEFICIO" ? (
          <Grid columns={2}>
            <Field label="Recolhida" required error={errors["icms.recolhida"]}>
              <TextInput
                value={data.icms.recolhida ?? ""}
                onChange={(e) => update("icms.recolhida", e.target.value)}
              />
            </Field>

            <Field label="Efetiva" required error={errors["icms.efetiva"]}>
              <TextInput
                value={data.icms.efetiva ?? ""}
                onChange={(e) => update("icms.efetiva", e.target.value)}
              />
            </Field>
          </Grid>
        ) : null}
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