"use client";

import { EscopoForm } from "@/domain/scope/types";
import RegimeEspecialList from "./blocks/RegimeEspecialList";
import ServicoToggleCard from "./blocks/ServicoToggleCard";
import {
  Field,
  NumberInput,
  Select,
  TextArea,
  TextInput,
} from "@/components/ui/form-fields";
import { Grid, Stack } from "@/components/ui/form-layout";

type Props = {
  form: EscopoForm;
  errors: Record<string, string>;
  onChange: (next: EscopoForm) => void;
};
function emptyImportacaoServicos(): NonNullable<
  EscopoForm["servicos"]["importacao"]
> {
  return {
    despachoAduaneiroImportacao: {
      habilitado: false,
      tipoValor: "",
      valor: null,
      ultimaAtualizacao: "",
    },
    preposto: {
      habilitado: false,
      valor: null,
      inclusoNoDesembaracoCasco: undefined,
      cidadesLiberacao: [],
      outroPorto: "",
      outraFronteira: "",
      prepostoSelecionado: null,
      observacao: "",
    },
    emissaoLiLpco: { habilitado: false, modalidade: undefined, valor: null },
    cadastroCatalogoProdutos: {
      habilitado: false,
      modalidade: undefined,
      valor: null,
    },
    assessoria: {
      habilitado: false,
      tipoValor: "",
      valor: null,
      ultimaAtualizacao: "",
    },
    freteInternacional: {
      habilitado: false,
      ptaxNegociado: "",
      observacao: "",
    },
    seguroInternacional: {
      habilitado: false,
      modalidade: undefined,
      valorMinimo: null,
      percentualSobreCfr: null,
      dataInclusaoApolice: null,
      descricaoComplementar: "",
    },
    freteRodoviario: {
      habilitado: false,
      modalidade: undefined,
      observacaoGeral: "",
    },
    regimeEspecial: [],
    emissaoNfe: { habilitado: false, modalidade: undefined, valor: null },
  };
}

export default function StepServicosImportacao({
  form,
  errors,
  onChange,
}: Props) {
  const data = form.servicos.importacao ?? emptyImportacaoServicos();
  function setData(next: NonNullable<EscopoForm["servicos"]["importacao"]>) {
    onChange({ ...form, servicos: { ...form.servicos, importacao: next } });
  }

  function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  function update(path: string, value: unknown) {
    const next = structuredClone(data) as Record<string, unknown>;

    const keys = path.split(".");
    let ref: Record<string, unknown> = next;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      const current = ref[key];

      if (!isObject(current)) {
        ref[key] = {};
      }

      ref = ref[key] as Record<string, unknown>;
    }

    ref[keys[keys.length - 1]] = value;

    setData(next as NonNullable<EscopoForm["servicos"]["importacao"]>);
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
              value={
                data.despachoAduaneiroImportacao.tipoValor as string | undefined
              }
              onChange={(e) =>
                update("despachoAduaneiroImportacao.tipoValor", e.target.value)
              }
            >
              <option value="">Selecione uma opção</option>
              <option value="SALARIO_MINIMO">Um salário mínimo vigente</option>
              <option value="OUTRO">Outro</option>
            </Select>
          </Field>
          {data.despachoAduaneiroImportacao.tipoValor === "OUTRO" ? (
            <Field label="Valor">
              <NumberInput
                value={data.despachoAduaneiroImportacao.valor ?? ""}
                onChange={(e) =>
                  update(
                    "despachoAduaneiroImportacao.valor",
                    Number(e.target.value),
                  )
                }
              />
            </Field>
          ) : null}
          <Field label="Última atualização" hint="Campo opcional">
            <TextInput
              type="date"
              value={data.despachoAduaneiroImportacao.ultimaAtualizacao ?? ""}
              onChange={(e) =>
                update(
                  "despachoAduaneiroImportacao.ultimaAtualizacao",
                  e.target.value,
                )
              }
            />
          </Field>

          <Field label="Observação geral" hint="Campo opcional">
            <TextArea
              value={data.despachoAduaneiroImportacao.observacao ?? ""}
              onChange={(e) =>
                update("despachoAduaneiroImportacao.observacao", e.target.value)
              }
            />
          </Field>
        </Grid>
      </ServicoToggleCard>
      <ServicoToggleCard
        title="Preposto"
        checked={data.preposto.habilitado}
        onToggle={(checked) => update("preposto.habilitado", checked)}
      >
        <Grid columns={2}>
          <Field
            label="Modalidade"
            required
            error={errors["preposto.modalidade"]}
          >
            <Select
              value={data.preposto.modalidade ?? ""}
              onChange={(e) => update("preposto.modalidade", e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="SIM">Sim</option>
              <option value="NAO">Não</option>
              <option value="CASO_A_CASO">Caso a caso</option>
            </Select>
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
        <Field label="Valor do preposto" required error={errors?.valor}>
          <NumberInput
            value={data.preposto.prepostoSelecionado?.valor ?? ""}
            onChange={(e) => update("preposto.prepostoSelecionado.valor", Number(e.target.value),)}
          />
        </Field>
        <Field label="Observação geral" hint="Campo opcional">
          <TextArea
            value={data.preposto.observacao ?? ""}
            onChange={(e) => update("preposto.observacao", e.target.value)}
          />
        </Field>
      </ServicoToggleCard>
      <ServicoToggleCard
        title="Emissão de LI / LPCO"
        checked={data.emissaoLiLpco.habilitado}
        onToggle={(checked) => update("emissaoLiLpco.habilitado", checked)}
      >
        <Field
          label="Modalidade"
          required
          error={errors["emissaoLiLpco.modalidade"]}
        >
          <Select
            value={data.emissaoLiLpco.modalidade ?? ""}
            onChange={(e) => update("emissaoLiLpco.modalidade", e.target.value)}
          >
            <option value="">Selecione</option>
            <option value="SIM">Sim</option>
            <option value="NAO">Não</option>
            <option value="CASO_A_CASO">Caso a caso</option>
          </Select>
        </Field>
        <Field label="Valor" error={errors["emissaoLiLpco.valor"]}>
          <NumberInput
            value={data.emissaoLiLpco.valor ?? ""}
            onChange={(e) =>
              update("emissaoLiLpco.valor", Number(e.target.value))
            }
          />
        </Field>

        <Field label="Observação geral" hint="Campo opcional">
          <TextArea
            value={data.emissaoLiLpco.observacao ?? ""}
            onChange={(e) => update("emissaoLiLpco.observacao", e.target.value)}
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
          label="Modalidade"
          required
          error={errors["cadastroCatalogoProdutos.modalidade"]}
        >
          <Select
            value={data.cadastroCatalogoProdutos.modalidade ?? ""}
            onChange={(e) =>
              update("cadastroCatalogoProdutos.modalidade", e.target.value)
            }
          >
            <option value="">Selecione</option>
            <option value="SIM">Sim</option>
            <option value="NAO">Não</option>
            <option value="CASO_A_CASO">Caso a caso</option>
          </Select>
        </Field>
        <Field label="Valor">
          <NumberInput
            value={data.cadastroCatalogoProdutos.valor ?? ""}
            onChange={(e) =>
              update("cadastroCatalogoProdutos.valor", Number(e.target.value))
            }
          />
        </Field>

        <Field label="Observação geral" hint="Campo opcional">
          <TextArea
            value={data.cadastroCatalogoProdutos.observacao ?? ""}
            onChange={(e) =>
              update("cadastroCatalogoProdutos.observacao", e.target.value)
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
              value={data.assessoria.tipoValor as string | undefined}
              onChange={(e) => update("assessoria.tipoValor", e.target.value)}
            >
              <option value="">Selecione uma opção</option>
              <option value="MEIO_SALARIO_MINIMO">
                Meio salário mínimo vigente
              </option>
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
          <Field label="Última atualização" hint="Campo opcional">
            <TextInput
              type="date"
              value={data.assessoria.ultimaAtualizacao ?? ""}
              onChange={(e) =>
                update("assessoria.ultimaAtualizacao", e.target.value)
              }
            />
          </Field>

          <Field label="Observação geral" hint="Campo opcional">
            <TextArea
              value={data.assessoria.observacao ?? ""}
              onChange={(e) => update("assessoria.observacao", e.target.value)}
            />
          </Field>
        </Grid>
      </ServicoToggleCard>
      <ServicoToggleCard
        title="Frete Internacional"
        checked={data.freteInternacional.habilitado}
        onToggle={(checked) => update("freteInternacional.habilitado", checked)}
      >
        <Field label="Modalidade" required>
          <Select
            value={data.freteInternacional.modalidade ?? ""}
            onChange={(e) =>
              update("freteInternacional.modalidade", e.target.value)
            }
          >
            <option value="">Selecione</option>
            <option value="SIM">Sim</option>
            <option value="NAO">Não</option>
            <option value="CASO_A_CASO">Caso a caso</option>
          </Select>
        </Field>

        <Field
          label="% PTAX negociada"
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

        <Field label="Observação geral" hint="Campo opcional">
          <TextArea
            value={data.freteInternacional.observacao ?? ""}
            onChange={(e) =>
              update("freteInternacional.observacao", e.target.value)
            }
          />
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
          label="Modalidade"
          required
          error={errors["seguroInternacional.modalidade"]}
        >
          <Select
            value={data.seguroInternacional.modalidade ?? ""}
            onChange={(e) =>
              update("seguroInternacional.modalidade", e.target.value)
            }
          >
            <option value="">Selecione</option>
            <option value="SIM">Sim</option>
            <option value="NAO">Não</option>
            <option value="CASO_A_CASO">Caso a caso</option>
          </Select>
        </Field>
        <Grid columns={2}>
          <Field label="% sobre frete + mercadoria (CFR/CPT)">
            <NumberInput
              value={data.seguroInternacional.percentualSobreCfr ?? ""}
              onChange={(e) =>
                update(
                  "seguroInternacional.percentualSobreCfr",
                  Number(e.target.value),
                )
              }
            />
          </Field>
        </Grid>
        <Field label="Data de inclusão da apólice" hint="Campo opcional">
          <TextInput
            type="date"
            value={data.seguroInternacional.dataInclusaoApolice ?? ""}
            onChange={(e) =>
              update("seguroInternacional.dataInclusaoApolice", e.target.value)
            }
          />
        </Field>
        <Field label="Descrição complementar" hint="Campo opcional">
          <TextArea
            value={data.seguroInternacional.descricaoComplementar ?? ""}
            onChange={(e) =>
              update(
                "seguroInternacional.descricaoComplementar",
                e.target.value,
              )
            }
          />
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
            onChange={(e) =>
              update("freteRodoviario.modalidade", e.target.value)
            }
          >
            <option value="">Selecione</option>
            <option value="SIM">Sim</option>
            <option value="NAO">Não</option>
            <option value="CASO_A_CASO">Caso a caso</option>
          </Select>
        </Field>
        <Field label="Observação geral" hint="Campo opcional">
          <TextArea
            value={data.freteRodoviario.observacaoGeral ?? ""}
            onChange={(e) =>
              update("freteRodoviario.observacaoGeral", e.target.value)
            }
          />
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
        <Field
          label="Modalidade"
          required
          error={errors["emissaoNfe.modalidade"]}
        >
          <Select
            value={data.emissaoNfe.modalidade ?? ""}
            onChange={(e) => update("emissaoNfe.modalidade", e.target.value)}
          >
            <option value="">Selecione</option>
            <option value="SIM">Sim</option>
            <option value="NAO">Não</option>
            <option value="CASO_A_CASO">Caso a caso</option>
          </Select>
        </Field>
        <Field label="Valor" required error={errors["emissaoNfe.valor"]}>
          <NumberInput
            value={data.emissaoNfe.valor ?? ""}
            onChange={(e) => update("emissaoNfe.valor", Number(e.target.value))}
          />
        </Field>

        <Field label="Observação geral" hint="Campo opcional">
          <TextArea
            value={data.emissaoNfe.observacao ?? ""}
            onChange={(e) => update("emissaoNfe.observacao", e.target.value)}
          />
        </Field>
      </ServicoToggleCard>
    </Stack>
  );
}
