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
import { useOrganizationSettingsByKey } from "@/lib/api/hooks/use-dashboards";
import {
  CONSUMPTION_SUBTYPE_OPTIONS,
  getConsumptionSubtypes,
  getIcmsDestinations,
  getPrimaryDestinations,
  ICMS_DESTINATION_LABELS,
  PRIMARY_DESTINATION_OPTIONS,
} from "@/domain/scope/destination";
import {
  filterUrfLocationsByModal,
  LOCAIS,
  MODAIS_LOCAL,
} from "@/domain/scope/locations";

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
  detalheBeneficio: "",
} as const;
const DEFAULT_ICMS = {
  contaPagamento: "CASCO",
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
  const { data: ctaBancariaData } = useOrganizationSettingsByKey(
    "dados_bancarios_casco",
  );
  const ctaBancariaCasco = ctaBancariaData ?? {};

  const data: NonNullable<EscopoForm["operacao"]["importacao"]> = form.operacao
    .importacao ?? {
    analistaDA: [""],
    analistaAE: [],
    produtosImportados: "",
    ncms: [{ codigo: "", possuiBeneficio: null, descricaoBeneficio: "" }],
    observacaoNcms: "",
    vinculoComExportador: "NAO",
    modaisEntrada: [],
    locaisEntrada: [],
    cidadesLocaisEntrada: [],
    outroLocalEntrada: "",
    modaisDesembaraco: [],
    locaisDesembaraco: [],
    cidadesLocaisDesembaraco: [],
    outroLocalDesembaraco: "",
    necessidadeDta: null,
    necessidadeDtc: null,
    necessidadeLiLpco: "NAO",
    anuencias: [],
    outroOrgaoAnuente: "",
    impostosFederais: {
      contaPagamento: "CASCO",
      ii: { detalheBeneficio: "" },
      ipi: { detalheBeneficio: "" },
      pis: { detalheBeneficio: "" },
      cofins: { detalheBeneficio: "" },
      observacao: "",
    },
    afrmm: { observacao: "" },
    icms: { observacao: "", porDestinacao: {} },
    destinacao: [],
    subtipoConsumo: [],
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
  const selectedPrimaryDestinations = getPrimaryDestinations(
    data.destinacao,
    data.subtipoConsumo,
  );
  const selectedConsumptionSubtypes = getConsumptionSubtypes(
    data.destinacao,
    data.subtipoConsumo,
  );
  const selectedIcmsDestinations = getIcmsDestinations(
    data.destinacao,
    data.subtipoConsumo,
  );
  const showConsumptionOptions =
    selectedPrimaryDestinations.includes("CONSUMO");
  const selectedDestinationOptions = [
    ...selectedPrimaryDestinations,
    ...(showConsumptionOptions ? selectedConsumptionSubtypes : []),
  ];
  const visibleDestinationOptions = [
    ...PRIMARY_DESTINATION_OPTIONS,
    ...(showConsumptionOptions ? CONSUMPTION_SUBTYPE_OPTIONS : []),
  ];
  const filterLocaisByModal = (modais: readonly string[] = []) =>
    filterUrfLocationsByModal(LOCAIS, modais).map(
      ({ value, label, cities }) => ({ value, label, cities }),
    );

  const entradaOptions = filterLocaisByModal(data.modaisEntrada);

  function citiesFromSelectedLocais(selected: readonly string[]) {
    const selectedValues = new Set(selected);
    return Array.from(
      new Set(
        LOCAIS.filter((local) => selectedValues.has(local.value)).flatMap(
          (local) => local.cities,
        ),
      ),
    );
  }

  function updateLocaisEntrada(next: string[]) {
    setData({
      ...data,
      locaisEntrada: next,
      cidadesLocaisEntrada: citiesFromSelectedLocais(next),
    });
  }

  function updateLocaisDesembaraco(next: string[]) {
    setData({
      ...data,
      locaisDesembaraco: next,
      cidadesLocaisDesembaraco: citiesFromSelectedLocais(next),
    });
  }

  return (
    <main className="flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        <p className="text-sm text-muted-foreground sm:text-base">
          Regras e parâmetros da operação de importação.
        </p>
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
          label="Produtos importados"
          required
          error={errors["produtosImportados"]}
        >
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
        title="Modais"
        searchLabel="Pesquisar modal"
        value={data.modaisEntrada ?? []}
        options={MODAIS_LOCAL}
        onChange={(next) => update("modaisEntrada", next)}
        allowCustomOption={false}
        error={errors["modaisEntrada"]}
      />

      <SearchableCheckboxMenu
        title="Locais de entrada"
        searchLabel="Pesquisar local de entrada"
        value={data.locaisEntrada}
        options={entradaOptions}
        onChange={updateLocaisEntrada}
        customValue={data.outroLocalEntrada ?? ""}
        onCustomValueChange={(next) => update("outroLocalEntrada", next)}
        customLabel="Outro local de entrada"
        error={errors["locaisEntrada"] || errors["outroLocalEntrada"]}
      />

      <SearchableCheckboxMenu
        title="Locais de desembaraço"
        searchLabel="Pesquisar local de desembaraço"
        value={data.locaisDesembaraco}
        options={entradaOptions}
        onChange={updateLocaisDesembaraco}
        customValue={data.outroLocalDesembaraco ?? ""}
        onCustomValueChange={(next) => update("outroLocalDesembaraco", next)}
        customLabel="Outro local de desembaraço"
        error={errors["locaisDesembaraco"] || errors["outroLocalDesembaraco"]}
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
              Banco: {ctaBancariaCasco.banco ?? "-"}{" "}
              {ctaBancariaCasco.nome_banco ?? "-"} • Agência:
              {ctaBancariaCasco.agencia ?? "-"}
              Conta: {ctaBancariaCasco.conta ?? "-"}
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
              <Field
                label={tributo.toUpperCase()}
                required
                error={errors[`impostosFederais.${tributo}.regime`]}
              >
                <Select
                  value={data.impostosFederais[tributo].regime ?? ""}
                  invalid={Boolean(
                    errors[`impostosFederais.${tributo}.regime`],
                  )}
                  onChange={(e) =>
                    update(
                      `impostosFederais.${tributo}.regime`,
                      e.target.value || undefined,
                    )
                  }
                >
                  <option value="">Selecione uma opção</option>
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
            onChange={(e) =>
              update("impostosFederais.observacao", e.target.value)
            }
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
          <Field label="Regime" required error={errors["afrmm.regime"]}>
            <Select
              value={afrmmData.regime ?? ""}
              invalid={Boolean(errors["afrmm.regime"])}
              onChange={(e) =>
                update("afrmm", {
                  ...afrmmData,
                  regime: e.target.value || undefined,
                })
              }
            >
              <option value="">Selecione uma opção</option>
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
          <Field label="Regime" required error={errors["icms.regime"]}>
            <Select
              value={icmsData.regime ?? ""}
              invalid={Boolean(errors["icms.regime"])}
              onChange={(e) =>
                update("icms", {
                  ...icmsData,
                  regime: e.target.value || undefined,
                })
              }
            >
              <option value="">Selecione uma opção</option>
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
        <Field label="Observações" hint="Campo opcional">
          <TextArea
            value={data.icms.observacao ?? ""}
            onChange={(e) => update("icms.observacao", e.target.value)}
          />
        </Field>
      </div>

      <Grid columns={1}>
        <Field label="Destinação" required>
          <SearchableCheckboxMenu
            title=""
            searchLabel="Pesquisar destinação"
            value={selectedDestinationOptions}
            options={visibleDestinationOptions}
            onChange={(next) => {
              const nextPrimaryDestinations = next.filter((value) =>
                PRIMARY_DESTINATION_OPTIONS.some(
                  (option) => option.value === value,
                ),
              );
              const hasConsumption =
                nextPrimaryDestinations.includes("CONSUMO");

              setData({
                ...data,
                destinacao: nextPrimaryDestinations as typeof data.destinacao,
                subtipoConsumo: hasConsumption
                  ? (next.filter((value) =>
                      CONSUMPTION_SUBTYPE_OPTIONS.some(
                        (option) => option.value === value,
                      ),
                    ) as typeof data.subtipoConsumo)
                  : [],
              });
            }}
            error={errors["destinacao"] ?? errors["subtipoConsumo"]}
          />
        </Field>
        {selectedIcmsDestinations.length > 0 ? (
          <div className="grid gap-3">
            {selectedIcmsDestinations.map((destino) => {
              const detalhe = icmsData.porDestinacao?.[destino] ?? {
                recolhida: "",
                efetiva: "",
              };

              return (
                <Card key={destino} className="gap-4 p-4">
                  <h3 className="text-sm font-semibold">
                    {ICMS_DESTINATION_LABELS[destino] ?? destino}
                  </h3>
                  <Grid columns={3}>
                    <Field
                      label="Regime"
                      required
                      error={errors[`icms.porDestinacao.${destino}.regime`]}
                    >
                      <Select
                        value={detalhe.regime ?? ""}
                        invalid={Boolean(
                          errors[`icms.porDestinacao.${destino}.regime`],
                        )}
                        onChange={(e) =>
                          update("icms", {
                            ...icmsData,
                            porDestinacao: {
                              ...icmsData.porDestinacao,
                              [destino]: {
                                ...detalhe,
                                regime: (e.target.value || undefined) as
                                  "INTEGRAL" | "BENEFICIO" | undefined,
                              },
                            },
                          })
                        }
                      >
                        <option value="">Selecione uma opção</option>
                        <option value="INTEGRAL">Integral</option>
                        <option value="BENEFICIO">Benefício</option>
                      </Select>
                    </Field>
                    <Field label="Alíquota base">
                      <TextInput
                        value={detalhe.recolhida ?? ""}
                        onChange={(e) =>
                          update("icms", {
                            ...icmsData,
                            porDestinacao: {
                              ...icmsData.porDestinacao,
                              [destino]: {
                                ...detalhe,
                                recolhida: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </Field>
                    <Field label="Alíquota efetiva">
                      <TextInput
                        value={detalhe.efetiva ?? ""}
                        onChange={(e) =>
                          update("icms", {
                            ...icmsData,
                            porDestinacao: {
                              ...icmsData.porDestinacao,
                              [destino]: {
                                ...detalhe,
                                efetiva: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </Field>
                  </Grid>
                </Card>
              );
            })}
          </div>
        ) : null}
      </Grid>
    </main>
  );
}
