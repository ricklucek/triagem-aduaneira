"use client";

import { EscopoForm } from "@/domain/scope/types";
import ContaBancariaBlock from "./blocks/ContaBancariaBlock";
import SearchableCheckboxMenu from "./blocks/SearchableCheckboxMenu";
import {
  Field,
  Select,
  TextArea,
  TextInput,
} from "@/components/ui/form-fields";
import { Card, Grid } from "@/components/ui/form-layout";
import { ResponsiblePicker } from "./ResponsiblePicker";
import type { ScopeResponsible } from "@/lib/api/types/scope-metadata";
import { Button } from "../ui/button";
import { formatNCM } from "@/utils/format";

const LOCAIS = [
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
const EMPTY_CONTA = { banco: "", agencia: "", conta: "" };
const DEFAULT_AFRMM = {
  contaPagamento: "CASCO",
  regime: "INTEGRAL",
  detalheBeneficio: "",
} as const;
const DEFAULT_ICMS = {
  contaPagamento: "CASCO",
  regime: "INTEGRAL",
  recolhida: "",
  efetiva: "",
} as const;

type Props = {
  form: EscopoForm;
  errors: Record<string, string>;
  onChange: (next: EscopoForm) => void;
  responsaveis: ScopeResponsible[];
};

export default function StepImportacao({
  form,
  errors,
  onChange,
  responsaveis,
}: Props) {
  const data: NonNullable<EscopoForm["operacao"]["importacao"]> = form.operacao
    .importacao ?? {
    analistaDA: "",
    analistaAE: "",
    produtosImportados: "",
    ncms: [{ codigo: "", possuiBeneficio: null, descricaoBeneficio: "" }],
    observacaoNcms: "",
    vinculoComExportador: "NAO",
    locaisDesembaraco: [],
    outroLocalDesembaraco: "",
    locaisDespacho: [],
    outroLocalDespacho: "",
    necessidadeDta: null,
    necessidadeDtc: null,
    necessidadeLiLpco: "NAO",
    anuencias: [],
    outroOrgaoAnuente: "",
    impostosFederais: {
      contaPagamento: "CASCO",
      ii: { regime: "INTEGRAL", detalheBeneficio: "" },
      ipi: { regime: "INTEGRAL", detalheBeneficio: "" },
      pis: { regime: "INTEGRAL", detalheBeneficio: "" },
      cofins: { regime: "INTEGRAL", detalheBeneficio: "" },
      observacao: ""
    },
    afrmm: { observacao: "" },
    icms: { regime: "INTEGRAL", observacao: "" },
    destinacao: [],
    subtipoConsumo: null,
  };

  function setData(next: NonNullable<EscopoForm["operacao"]["importacao"]>) {
    onChange({ ...form, operacao: { ...form.operacao, importacao: next } });
  }
  function update(path: string, value: unknown) {
    const next = structuredClone(data) as Record<string, unknown>;
    const keys = path.split(".");
    let ref = next;
    for (let i = 0; i < keys.length - 1; i++) {
      ref = ref[keys[i]] as Record<string, unknown>;
    }
    ref[keys[keys.length - 1]] = value;
    setData(next as NonNullable<EscopoForm["operacao"]["importacao"]>);
  }
  const afrmmData = data.afrmm ?? { ...DEFAULT_AFRMM };
  const icmsData = data.icms ?? { ...DEFAULT_ICMS };
  const options = LOCAIS.map(([value, label]) => ({ value, label }));
  const cascoAccount = form.informacoesFixas.dadosBancariosCasco;

  return (
    <main className="flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        <p className="text-sm text-muted-foreground sm:text-base">
          Regras e parâmetros da operação de importação.
        </p>
        <Grid columns={2}>
          <ResponsiblePicker
            label="Analista DA"
            value={data.analistaDA}
            onChange={(value) => update("analistaDA", value)}
            options={responsaveis}
            error={errors["analistaDA"]}
            filterSetores={["Operação", "operacao", "Despacho Aduaneiro"]}
          />
          <ResponsiblePicker
            label="Analista AE"
            value={data.analistaAE ?? ""}
            onChange={(value) => update("analistaAE", value)}
            options={responsaveis}
            error={errors["analistaAE"]}
            filterSetores={["Operação", "operacao", "Despacho Aduaneiro"]}
          />
        </Grid>
        <Field label="Produtos importados" required error={errors["produtosImportados"]}>
          <TextArea
            value={data.produtosImportados ?? ""}
            onChange={(e) => update("produtosImportados", e.target.value)}
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

      <Grid columns={3}>
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
          label="Necessidade de DTA"
          required
          error={errors["necessidadeDta"]}
        >
          <Select
            value={data.necessidadeDta ?? ""}
            onChange={(e) => update("necessidadeDta", e.target.value || null)}
          >
            <option value="">Selecione</option>
            <option value="SIM">Sim</option>
            <option value="NAO">Não</option>
          </Select>
        </Field>
        <Field
          label="Necessidade de DTC"
          required
          error={errors["necessidadeDtc"]}
        >
          <Select
            value={data.necessidadeDtc ?? ""}
            onChange={(e) => update("necessidadeDtc", e.target.value || null)}
          >
            <option value="">Selecione</option>
            <option value="SIM">Sim</option>
            <option value="NAO">Não</option>
          </Select>
        </Field>
      </Grid>

      <SearchableCheckboxMenu
        title="Locais de desembaraço"
        searchLabel="Pesquisar local de desembaraço"
        value={data.locaisDesembaraco}
        options={options}
        onChange={(next) => update("locaisDesembaraco", next)}
        customValue={data.outroLocalDesembaraco ?? ""}
        onCustomValueChange={(next) => update("outroLocalDesembaraco", next)}
        customLabel="Outro local de desembaraço"
        error={errors["locaisDesembaraco"] || errors["outroLocalDesembaraco"]}
      />

      <SearchableCheckboxMenu
        title="Locais de despacho"
        searchLabel="Pesquisar local de despacho"
        value={data.locaisDespacho}
        options={options}
        onChange={(next) => update("locaisDespacho", next)}
        customValue={data.outroLocalDespacho ?? ""}
        onCustomValueChange={(next) => update("outroLocalDespacho", next)}
        customLabel="Outro local de despacho"
        error={errors["locaisDespacho"] || errors["outroLocalDespacho"]}
      />

      <div className="flex flex-col gap-5">
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
          <>
            <SearchableCheckboxMenu
              title="Órgãos anuentes"
              searchLabel="Pesquisar órgão anuente"
              value={data.anuencias}
              options={ANUENCIAS.map((item) => ({ value: item, label: item }))}
              onChange={(next) => update("anuencias", next)}
              customValue={data.outroOrgaoAnuente ?? ""}
              onCustomValueChange={(next) => update("outroOrgaoAnuente", next)}
              customLabel="Outro órgão anuente"
              error={errors["anuencias"] || errors["outroOrgaoAnuente"]}
            />
          </>
        ) : null}
      </div>

      <div className="flex flex-col gap-5">
        <h2 className="text-xl font-semibold tracking-tight">
          Impostos Federais
        </h2>
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
        {data.impostosFederais.contaPagamento === "CASCO" ? (
          <Card className="gap-3 rounded-2xl border-border/80 p-4 shadow-none">
            <h3 className="text-sm font-semibold">Dados bancários da Casco</h3>
            <p className="text-sm text-muted-foreground">
              Banco: {cascoAccount.banco || "-"} • Agência:{" "}
              {cascoAccount.agencia || "-"} • Conta: {cascoAccount.conta || "-"}
            </p>
          </Card>
        ) : null}
        {data.impostosFederais.contaPagamento === "CLIENTE" ? (
          <ContaBancariaBlock
            title="Conta do cliente"
            value={data.impostosFederais.dadosContaCliente ?? EMPTY_CONTA}
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
                        e.target.value,
                      )
                    }
                  />
                </Field>
              ) : null}
            </Grid>
          </Card>
        ))}

        <Field label="Observações" hint="Campo opcional">
          <TextArea
            value={data.impostosFederais.observacao ?? ""}
            onChange={(e) => update("impostosFederais.observacao", e.target.value)}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-5">
        <h2 className="text-xl font-semibold tracking-tight">AFRMM</h2>
        <Grid columns={2}>
          <Field label="Conta para pagamento" required>
            <Select
              value={afrmmData.contaPagamento ?? "CASCO"}
              onChange={(e) =>
                update("afrmm", {
                  ...afrmmData,
                  contaPagamento: e.target.value,
                })
              }
            >
              <option value="CASCO">Conta da Casco</option>
              <option value="CLIENTE">Conta do cliente</option>
            </Select>
          </Field>
          <Field label="Regime" required>
            <Select
              value={afrmmData.regime ?? "INTEGRAL"}
              onChange={(e) =>
                update("afrmm", { ...afrmmData, regime: e.target.value })
              }
            >
              <option value="INTEGRAL">Integral</option>
              <option value="BENEFICIO">Benefício</option>
            </Select>
          </Field>
        </Grid>
        {afrmmData.contaPagamento === "CLIENTE" ? (
          <ContaBancariaBlock
            title="Dados da conta do cliente"
            value={afrmmData.dadosContaCliente ?? EMPTY_CONTA}
            onChange={(next) =>
              update("afrmm", { ...afrmmData, dadosContaCliente: next })
            }
          />
        ) : null}
        {afrmmData.regime === "BENEFICIO" ? (
          <Field
            label="Detalhe do benefício"
            required
            error={errors["afrmm.detalheBeneficio"]}
          >
            <TextInput
              value={afrmmData.detalheBeneficio ?? ""}
              onChange={(e) =>
                update("afrmm", {
                  ...afrmmData,
                  detalheBeneficio: e.target.value,
                })
              }
            />
          </Field>
        ) : null}

        <Field label="Observações" hint="Campo opcional">
          <TextArea
            value={data.afrmm.observacao ?? ""}
            onChange={(e) => update("afrmm.observacao", e.target.value)}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-5">
        <h2 className="text-xl font-semibold tracking-tight">ICMS</h2>
        <Grid columns={2}>
          <Field label="Conta para pagamento" required>
            <Select
              value={icmsData.contaPagamento ?? "CASCO"}
              onChange={(e) =>
                update("icms", { ...icmsData, contaPagamento: e.target.value })
              }
            >
              <option value="CASCO">Conta da Casco</option>
              <option value="CLIENTE">Conta do cliente</option>
            </Select>
          </Field>
          <Field label="Regime" required>
            <Select
              value={icmsData.regime ?? "INTEGRAL"}
              onChange={(e) =>
                update("icms", { ...icmsData, regime: e.target.value })
              }
            >
              <option value="INTEGRAL">Integral</option>
              <option value="BENEFICIO">Benefício</option>
            </Select>
          </Field>
        </Grid>
        {icmsData.contaPagamento === "CLIENTE" ? (
          <ContaBancariaBlock
            title="Dados da conta do cliente"
            value={icmsData.dadosContaCliente ?? EMPTY_CONTA}
            onChange={(next) =>
              update("icms", { ...icmsData, dadosContaCliente: next })
            }
          />
        ) : null}
        {icmsData.regime === "BENEFICIO" ? (
          <Grid columns={2}>
            <Field label="Recolhida" required>
              <TextInput
                value={icmsData.recolhida ?? ""}
                onChange={(e) =>
                  update("icms", { ...icmsData, recolhida: e.target.value })
                }
              />
            </Field>
            <Field label="Efetiva" required>
              <TextInput
                value={icmsData.efetiva ?? ""}
                onChange={(e) =>
                  update("icms", { ...icmsData, efetiva: e.target.value })
                }
              />
            </Field>
          </Grid>
        ) : null}
        <Field label="Observações" hint="Campo opcional">
          <TextArea
            value={data.icms.observacao ?? ""}
            onChange={(e) => update("icms.observacao", e.target.value)}
          />
        </Field>
      </div>

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
    </main>
  );
}
