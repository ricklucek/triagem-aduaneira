"use client";

import { EscopoForm } from "@/domain/scope/types";
import RegimeEspecialList from "./blocks/RegimeEspecialList";
import ServicoToggleCard from "./blocks/ServicoToggleCard";
import { Field, NumberInput, Select, TextArea, TextInput } from "@/components/ui/form-fields";
import { Grid, Stack } from "@/components/ui/form-layout";

type Props = {
  form: EscopoForm;
  errors: Record<string, string>;
  onChange: (next: EscopoForm) => void;
};

const RESPONSAVEIS = [
  ["ANNA", "Anna"],
  ["CLEVERSON", "Cleverson"],
  ["MARCUS", "Marcus"],
  ["GILMARA", "Gilmara"],
  ["THEILA", "Theila"],
  ["KAROL", "Karol"],
  ["LAYSA", "Laysa"],
  ["ANTONIO", "Antonio"],
  ["JONATHAN", "Jonathan"],
  ["BRUNA_PARIZOTTO", "Bruna Parizotto"],
  ["BERNARDO", "Bernardo"],
  ["EVERTON", "Everton"],
  ["VINICIUS", "Vinicius"],
  ["KLEBER", "Kleber"],
] as const;

function emptyImportacaoServicos(): NonNullable<EscopoForm["servicos"]["importacao"]> {
  return {
    despachoAduaneiroImportacao: {
      habilitado: false,
      tipoValor: "SALARIO_MINIMO",
      valor: null,
      responsavel: undefined,
    },
    preposto: { habilitado: false, valor: null, inclusoNoDesembaracoCasco: undefined },
    emissaoLiLpco: { habilitado: false, valor: null },
    cadastroCatalogoProdutos: { habilitado: false, valor: null },
    assessoria: {
      habilitado: false,
      tipoValor: "SALARIO_MINIMO",
      valor: null,
      responsavel: undefined,
    },
    freteInternacional: {
      habilitado: false,
      ptaxNegociado: "",
      percentualSobreCfr: null,
      responsavel: undefined,
    },
    seguroInternacional: {
      habilitado: false,
      valorNegociado: null,
      descricaoComplementar: "",
      responsavel: undefined,
    },
    freteRodoviario: { habilitado: false, modalidade: undefined, responsavel: undefined },
    regimeEspecial: [],
    emissaoNfe: { habilitado: false, valor: null },
  };
}

export default function StepServicosImportacao({
  form,
  errors,
  onChange,
}: Props) {
  const data = form.servicos.importacao ?? emptyImportacaoServicos();

  function setData(next: NonNullable<EscopoForm["servicos"]["importacao"]>) {
    onChange({
      ...form,
      servicos: { ...form.servicos, importacao: next },
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

  return (
    <Stack>
      <ServicoToggleCard
        title="Despacho Aduaneiro Importação"
        checked={data.despachoAduaneiroImportacao.habilitado}
        onToggle={(checked) =>
          update("despachoAduaneiroImportacao.habilitado", checked)
        }
      >
        <Grid columns={2}>
          <Field label="Tipo de valor" required>
            <Select
              value={data.despachoAduaneiroImportacao.tipoValor}
              onChange={(e) =>
                update("despachoAduaneiroImportacao.tipoValor", e.target.value)
              }
            >
              <option value="SALARIO_MINIMO">Um salário mínimo vigente</option>
              <option value="OUTRO">Outro</option>
            </Select>
          </Field>

          {data.despachoAduaneiroImportacao.tipoValor === "OUTRO" ? (
            <Field
              label="Valor"
              required
              error={errors["despachoAduaneiroImportacao.valor"]}
            >
              <NumberInput
                value={data.despachoAduaneiroImportacao.valor ?? ""}
                onChange={(e) =>
                  update(
                    "despachoAduaneiroImportacao.valor",
                    Number(e.target.value)
                  )
                }
              />
            </Field>
          ) : null}
        </Grid>

        <Field label="Responsável" required error={errors["despachoAduaneiroImportacao.responsavel"]}>
          <Select
            value={data.despachoAduaneiroImportacao.responsavel ?? ""}
            onChange={(e) => update("despachoAduaneiroImportacao.responsavel", e.target.value)}
          >
            <option value="">Selecione</option>
            {RESPONSAVEIS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </ServicoToggleCard>

      <ServicoToggleCard
        title="Preposto"
        checked={data.preposto.habilitado}
        onToggle={(checked) => update("preposto.habilitado", checked)}
      >
        <Grid columns={2}>
          <Field label="Valor" required error={errors["preposto.valor"]}>
            <NumberInput
              value={data.preposto.valor ?? ""}
              onChange={(e) => update("preposto.valor", Number(e.target.value))}
            />
          </Field>

          <Field
            label="Incluso no serviço de desembaraço da Casco"
            required
            error={errors["preposto.inclusoNoDesembaracoCasco"]}
          >
            <Select
              value={data.preposto.inclusoNoDesembaracoCasco ?? ""}
              onChange={(e) =>
                update("preposto.inclusoNoDesembaracoCasco", e.target.value)
              }
            >
              <option value="">Selecione</option>
              <option value="SIM">Sim</option>
              <option value="NAO">Não</option>
            </Select>
          </Field>
        </Grid>
      </ServicoToggleCard>

      <ServicoToggleCard
        title="Emissão de LI / LPCO"
        checked={data.emissaoLiLpco.habilitado}
        onToggle={(checked) => update("emissaoLiLpco.habilitado", checked)}
      >
        <Field label="Valor" required error={errors["emissaoLiLpco.valor"]}>
          <NumberInput
            value={data.emissaoLiLpco.valor ?? ""}
            onChange={(e) => update("emissaoLiLpco.valor", Number(e.target.value))}
          />
        </Field>
      </ServicoToggleCard>

      <ServicoToggleCard
        title="Cadastro de Catálogo de Produtos"
        checked={data.cadastroCatalogoProdutos.habilitado}
        onToggle={(checked) =>
          update("cadastroCatalogoProdutos.habilitado", checked)
        }
      >
        <Field
          label="Valor"
          required
          error={errors["cadastroCatalogoProdutos.valor"]}
        >
          <NumberInput
            value={data.cadastroCatalogoProdutos.valor ?? ""}
            onChange={(e) =>
              update("cadastroCatalogoProdutos.valor", Number(e.target.value))
            }
          />
        </Field>
      </ServicoToggleCard>

      <ServicoToggleCard
        title="Assessoria"
        checked={data.assessoria.habilitado}
        onToggle={(checked) => update("assessoria.habilitado", checked)}
      >
        <Grid columns={2}>
          <Field label="Tipo de valor" required>
            <Select
              value={data.assessoria.tipoValor}
              onChange={(e) => update("assessoria.tipoValor", e.target.value)}
            >
              <option value="SALARIO_MINIMO">Um salário mínimo vigente</option>
              <option value="OUTRO">Outro</option>
            </Select>
          </Field>

          {data.assessoria.tipoValor === "OUTRO" ? (
            <Field label="Valor" required error={errors["assessoria.valor"]}>
              <NumberInput
                value={data.assessoria.valor ?? ""}
                onChange={(e) =>
                  update("assessoria.valor", Number(e.target.value))
                }
              />
            </Field>
          ) : null}
        </Grid>
        <Field label="Responsável" required error={errors["assessoria.responsavel"]}>
          <Select
            value={data.assessoria.responsavel ?? ""}
            onChange={(e) => update("assessoria.responsavel", e.target.value)}
          >
            <option value="">Selecione</option>
            {RESPONSAVEIS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </ServicoToggleCard>

      <ServicoToggleCard
        title="Frete Internacional"
        checked={data.freteInternacional.habilitado}
        onToggle={(checked) =>
          update("freteInternacional.habilitado", checked)
        }
      >
        <Grid columns={2}>
          <Field
            label="PTAX negociado"
            required
            error={errors["freteInternacional.ptaxNegociado"]}
          >
            <TextInput
              value={data.freteInternacional.ptaxNegociado ?? ""}
              onChange={(e) =>
                update("freteInternacional.ptaxNegociado", e.target.value)
              }
            />
          </Field>

          <Field label="% sobre CFR" required error={errors["freteInternacional.percentualSobreCfr"]}>
            <NumberInput
              value={data.freteInternacional.percentualSobreCfr ?? ""}
              onChange={(e) =>
                update("freteInternacional.percentualSobreCfr", Number(e.target.value))
              }
            />
          </Field>
        </Grid>

        <Field label="Responsável" required error={errors["freteInternacional.responsavel"]}>
          <Select
            value={data.freteInternacional.responsavel ?? ""}
            onChange={(e) => update("freteInternacional.responsavel", e.target.value)}
          >
            <option value="">Selecione</option>
            {RESPONSAVEIS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </ServicoToggleCard>

      <ServicoToggleCard
        title="Seguro Internacional"
        checked={data.seguroInternacional.habilitado}
        onToggle={(checked) =>
          update("seguroInternacional.habilitado", checked)
        }
      >
        <Field
          label="Valor negociado"
          required
          error={errors["seguroInternacional.valorNegociado"]}
        >
          <NumberInput
            value={data.seguroInternacional.valorNegociado ?? ""}
            onChange={(e) =>
              update("seguroInternacional.valorNegociado", Number(e.target.value))
            }
          />
        </Field>

        <Field
          label="Descrição complementar"
          hint="Campo opcional"
        >
          <TextArea
            value={data.seguroInternacional.descricaoComplementar ?? ""}
            onChange={(e) =>
              update("seguroInternacional.descricaoComplementar", e.target.value)
            }
          />
        </Field>

        <Field label="Responsável" required error={errors["seguroInternacional.responsavel"]}>
          <Select
            value={data.seguroInternacional.responsavel ?? ""}
            onChange={(e) => update("seguroInternacional.responsavel", e.target.value)}
          >
            <option value="">Selecione</option>
            {RESPONSAVEIS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </ServicoToggleCard>

      <ServicoToggleCard
        title="Frete Rodoviário"
        checked={data.freteRodoviario.habilitado}
        onToggle={(checked) => update("freteRodoviario.habilitado", checked)}
      >
        <Field
          label="Modalidade"
          required
          error={errors["freteRodoviario.modalidade"]}
        >
          <Select
            value={data.freteRodoviario.modalidade ?? ""}
            onChange={(e) => update("freteRodoviario.modalidade", e.target.value)}
          >
            <option value="">Selecione</option>
            <option value="SIM">Sim</option>
            <option value="CASO_A_CASO">Caso a caso</option>
          </Select>
        </Field>

        <Field label="Responsável" required error={errors["freteRodoviario.responsavel"]}>
          <Select
            value={data.freteRodoviario.responsavel ?? ""}
            onChange={(e) => update("freteRodoviario.responsavel", e.target.value)}
          >
            <option value="">Selecione</option>
            {RESPONSAVEIS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </ServicoToggleCard>

      <RegimeEspecialList
        items={data.regimeEspecial}
        onChange={(next) => update("regimeEspecial", next)}
      />

      <ServicoToggleCard
        title="Emissão de NFE"
        checked={data.emissaoNfe.habilitado}
        onToggle={(checked) => update("emissaoNfe.habilitado", checked)}
      >
        <Field label="Valor" required error={errors["emissaoNfe.valor"]}>
          <NumberInput
            value={data.emissaoNfe.valor ?? ""}
            onChange={(e) => update("emissaoNfe.valor", Number(e.target.value))}
          />
        </Field>
      </ServicoToggleCard>
    </Stack>
  );
}