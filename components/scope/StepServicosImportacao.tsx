"use client";

import { useMemo, useState } from "react";
import { EscopoForm } from "@/domain/scope/types";
import RegimeEspecialList from "./blocks/RegimeEspecialList";
import ServicoToggleCard from "./blocks/ServicoToggleCard";
import PrepostoLookupPanel from "./blocks/PrepostoLookupPanel";
import {
  Field,
  NumberInput,
  Select,
  TextArea,
  TextInput,
} from "@/components/ui/form-fields";
import { Grid, Stack } from "@/components/ui/form-layout";
import { ResponsiblePicker } from "./ResponsiblePicker";
import type { ScopeResponsible } from "@/lib/api/types/scope-metadata";
import { publicApi } from "@/lib/api/services/public";
import type { PrepostoLookupItem } from "@/lib/api/types/public-api";

type Props = {
  form: EscopoForm;
  errors: Record<string, string>;
  onChange: (next: EscopoForm) => void;
  responsaveis: ScopeResponsible[];
};
function emptyImportacaoServicos(): NonNullable<
  EscopoForm["servicos"]["importacao"]
> {
  return {
    despachoAduaneiroImportacao: {
      habilitado: false,
      tipoValor: "SALARIO_MINIMO",
      valor: null,
      responsavel: undefined,
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
    },
    emissaoLiLpco: { habilitado: false, valor: null },
    cadastroCatalogoProdutos: { habilitado: false, valor: null },
    assessoria: {
      habilitado: false,
      tipoValor: "SALARIO_MINIMO",
      valor: null,
      responsavel: undefined,
      ultimaAtualizacao: "",
    },
    freteInternacional: { habilitado: false, ptaxNegociado: "" },
    seguroInternacional: {
      habilitado: false,
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
    emissaoNfe: { habilitado: false, valor: null },
  };
}
const CIDADES = [
  "Foz do Iguaçu",
  "Uruguaiana",
  "Jaguarão",
  "Chuí",
  "Corumbá",
  "Santos",
  "Itajaí",
  "Paranaguá",
  "Campinas",
  "Guarulhos",
];

export default function StepServicosImportacao({
  form,
  errors,
  onChange,
  responsaveis,
}: Props) {
  const data = form.servicos.importacao ?? emptyImportacaoServicos();
  const [loadingPrepostos, setLoadingPrepostos] = useState(false);
  const [prepostoResults, setPrepostoResults] = useState<PrepostoLookupItem[]>(
    [],
  );
  function setData(next: NonNullable<EscopoForm["servicos"]["importacao"]>) {
    onChange({ ...form, servicos: { ...form.servicos, importacao: next } });
  }
  function update(path: string, value: unknown) {
    const next = structuredClone(data) as Record<string, unknown>;
    const keys = path.split(".");
    let ref = next;
    for (let i = 0; i < keys.length - 1; i++) {
      ref = ref[keys[i]] as Record<string, unknown>;
    }
    ref[keys[keys.length - 1]] = value;
    setData(next as NonNullable<EscopoForm["servicos"]["importacao"]>);
  }
  const cidadeConsulta = useMemo(
    () =>
      data.preposto.cidadesLiberacao[0] ??
      data.preposto.outroPorto ??
      data.preposto.outraFronteira ??
      "",
    [data.preposto],
  );
  async function handleLookupPrepostos() {
    if (!cidadeConsulta.trim()) return;
    setLoadingPrepostos(true);
    try {
      const res = await publicApi.lookupPrepostos({
        cidade: cidadeConsulta,
        operacao: "IMPORTACAO",
      });
      setPrepostoResults(res.items);
    } catch {
      setPrepostoResults([]);
    } finally {
      setLoadingPrepostos(false);
    }
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
        </Grid>
        <ResponsiblePicker
          label="Responsável"
          value={data.despachoAduaneiroImportacao.responsavel ?? ""}
          onChange={(value) =>
            update("despachoAduaneiroImportacao.responsavel", value)
          }
          options={responsaveis}
          error={errors["despachoAduaneiroImportacao.responsavel"]}
        />
      </ServicoToggleCard>
      <ServicoToggleCard
        title="Preposto"
        checked={data.preposto.habilitado}
        onToggle={(checked) => update("preposto.habilitado", checked)}
      >
        <Grid columns={2}>
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
        <Grid columns={2}>
          <Field
            label="Portos e fronteiras de liberação"
            error={errors["preposto.cidadesLiberacao"]}
          >
            <Select
              value={data.preposto.cidadesLiberacao[0] ?? ""}
              onChange={(e) =>
                update(
                  "preposto.cidadesLiberacao",
                  e.target.value ? [e.target.value] : [],
                )
              }
            >
              <option value="">Selecione</option>
              {CIDADES.map((cidade) => (
                <option key={cidade} value={cidade}>
                  {cidade}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Outro porto">
            <TextInput
              value={data.preposto.outroPorto ?? ""}
              onChange={(e) => update("preposto.outroPorto", e.target.value)}
            />
          </Field>
          <Field label="Outra fronteira">
            <TextInput
              value={data.preposto.outraFronteira ?? ""}
              onChange={(e) =>
                update("preposto.outraFronteira", e.target.value)
              }
            />
          </Field>
        </Grid>
        <PrepostoLookupPanel
          title="Consulta de prepostos"
          cidade={cidadeConsulta}
          loading={loadingPrepostos}
          results={prepostoResults}
          selected={data.preposto.prepostoSelecionado ?? undefined}
          onSearch={handleLookupPrepostos}
          onChange={(next) => update("preposto.prepostoSelecionado", next)}
          errors={{
            nome: errors["preposto.prepostoSelecionado.nome"],
            telefone: errors["preposto.prepostoSelecionado.telefone"],
            valor: errors["preposto.prepostoSelecionado.valor"],
          }}
        />
      </ServicoToggleCard>
      <ServicoToggleCard
        title="Emissão de LI / LPCO"
        checked={data.emissaoLiLpco.habilitado}
        onToggle={(checked) => update("emissaoLiLpco.habilitado", checked)}
      >
        <Field label="Valor" required error={errors["emissaoLiLpco.valor"]}>
          <NumberInput
            value={data.emissaoLiLpco.valor ?? ""}
            onChange={(e) =>
              update("emissaoLiLpco.valor", Number(e.target.value))
            }
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
              value={data.assessoria.tipoValor as string | undefined}
              onChange={(e) => update("assessoria.tipoValor", e.target.value)}
            >
              <option value="SALARIO_MINIMO">
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
        </Grid>
        <ResponsiblePicker
          label="Responsável"
          value={data.assessoria.responsavel ?? ""}
          onChange={(value) => update("assessoria.responsavel", value)}
          options={responsaveis}
          error={errors["assessoria.responsavel"]}
        />
      </ServicoToggleCard>
      <ServicoToggleCard
        title="Frete Internacional"
        checked={data.freteInternacional.habilitado}
        onToggle={(checked) => update("freteInternacional.habilitado", checked)}
      >
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
      </ServicoToggleCard>
      <ServicoToggleCard
        title="Seguro Internacional"
        checked={data.seguroInternacional.habilitado}
        onToggle={(checked) =>
          update("seguroInternacional.habilitado", checked)
        }
      >
        <Grid columns={2}>
          <Field
            label="% sobre CFR"
            required
            error={errors["seguroInternacional.percentualSobreCfr"]}
          >
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
