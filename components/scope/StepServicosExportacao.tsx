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
function emptyExportacaoServicos(): NonNullable<
  EscopoForm["servicos"]["exportacao"]
> {
  return {
    despachoAduaneiroExportacao: {
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
    certificadoOrigem: { habilitado: false, valor: null },
    certificadoFitossanitario: { habilitado: false, valor: null },
    outrosCertificados: { habilitado: false, itens: [] },
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
export default function StepServicosExportacao({
  form,
  errors,
  onChange,
  responsaveis,
}: Props) {
  const data = form.servicos.exportacao ?? emptyExportacaoServicos();
  
  function setData(next: NonNullable<EscopoForm["servicos"]["exportacao"]>) {
    onChange({ ...form, servicos: { ...form.servicos, exportacao: next } });
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

    setData(next as NonNullable<EscopoForm["servicos"]["exportacao"]>);
  }

  return (
    <Stack>
      <ServicoToggleCard
        title="Despacho Aduaneiro Exportação"
        checked={data.despachoAduaneiroExportacao.habilitado}
        onToggle={(checked) =>
          update("despachoAduaneiroExportacao.habilitado", checked)
        }
      >
        <Grid columns={2}>
          <Field label="Tipo de valor" required>
            <Select
              value={
                data.despachoAduaneiroExportacao.tipoValor as string | undefined
              }
              onChange={(e) =>
                update("despachoAduaneiroExportacao.tipoValor", e.target.value)
              }
            >
              <option value="">Selecione uma opção</option>
              <option value="SALARIO_MINIMO">Um salário mínimo vigente</option>
              <option value="OUTRO">Outro</option>
            </Select>
          </Field>
          {data.despachoAduaneiroExportacao.tipoValor === "OUTRO" ? (
            <Field label="Valor">
              <NumberInput
                value={data.despachoAduaneiroExportacao.valor ?? ""}
                onChange={(e) =>
                  update(
                    "despachoAduaneiroExportacao.valor",
                    Number(e.target.value),
                  )
                }
              />
            </Field>
          ) : null}
          <Field label="Última atualização" hint="Campo opcional">
            <TextInput
              type="date"
              value={data.despachoAduaneiroExportacao.ultimaAtualizacao ?? ""}
              onChange={(e) =>
                update(
                  "despachoAduaneiroExportacao.ultimaAtualizacao",
                  e.target.value,
                )
              }
            />
          </Field>

          <Field label="Observação geral" hint="Campo opcional">
            <TextArea
              value={data.despachoAduaneiroExportacao.observacao ?? ""}
              onChange={(e) =>
                update("despachoAduaneiroExportacao.observacao", e.target.value)
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
        title="Certificado de Origem"
        checked={data.certificadoOrigem.habilitado}
        onToggle={(checked) => update("certificadoOrigem.habilitado", checked)}
      >
        <Grid columns={2}>
          <Field
            label="Modalidade"
            required
            error={errors["certificadoOrigem.modalidade"]}
          >
            <Select
              value={data.certificadoOrigem.modalidade ?? ""}
              onChange={(e) => update("certificadoOrigem.modalidade", e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="SIM">Sim</option>
              <option value="NAO">Não</option>
              <option value="CASO_A_CASO">Caso a caso</option>
            </Select>
          </Field>
          <Field label="Valor">
            <NumberInput
              value={data.certificadoOrigem.valor ?? ""}
              onChange={(e) =>
                update("certificadoOrigem.valor", Number(e.target.value))
              }
            />
          </Field>
        </Grid>
        <Field label="Observação geral" hint="Campo opcional">
          <TextArea
            value={data.certificadoOrigem.observacao ?? ""}
            onChange={(e) =>
              update("certificadoOrigem.observacao", e.target.value)
            }
          />
        </Field>
      </ServicoToggleCard>
      <ServicoToggleCard
        title="Certificado Fitossanitário"
        checked={data.certificadoFitossanitario.habilitado}
        onToggle={(checked) =>
          update("certificadoFitossanitario.habilitado", checked)
        }
      >
        <Grid columns={2}>
          <Field
            label="Modalidade"
            required
            error={errors["certificadoOrigem.modalidade"]}
          >
            <Select
              value={data.certificadoOrigem.modalidade ?? ""}
              onChange={(e) => update("certificadoOrigem.modalidade", e.target.value)}
            >
              <option value="">Selecione</option>
              <option value="SIM">Sim</option>
              <option value="NAO">Não</option>
              <option value="CASO_A_CASO">Caso a caso</option>
            </Select>
          </Field>
          <Field label="Valor" required>
            <NumberInput
              value={data.certificadoFitossanitario.valor ?? ""}
              onChange={(e) =>
                update("certificadoFitossanitario.valor", Number(e.target.value))
              }
            />
          </Field>
        </Grid>
        <Field label="Observação geral" hint="Campo opcional">
          <TextArea
            value={data.certificadoFitossanitario.observacao ?? ""}
            onChange={(e) =>
              update("certificadoFitossanitario.observacao", e.target.value)
            }
          />
        </Field>
      </ServicoToggleCard>
      <ServicoToggleCard
        title="Outros certificados"
        checked={data.outrosCertificados.habilitado}
        onToggle={(checked) => update("outrosCertificados.habilitado", checked)}
      >
        <button
          type="button"
          onClick={() =>
            update("outrosCertificados.itens", [
              ...(data.outrosCertificados.itens ?? []),
              { chave: "", valor: null },
            ])
          }
        >
          + Adicionar certificado
        </button>
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {(data.outrosCertificados.itens ?? []).map((item, index) => (
            <div
              key={index}
              style={{
                border: "1px solid #eaecf0",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <Grid columns={2}>
                <Field label="Certificado" required>
                  <TextInput
                    value={item.chave}
                    onChange={(e) => {
                      const next = [...data.outrosCertificados.itens];
                      next[index] = { ...next[index], chave: e.target.value };
                      update("outrosCertificados.itens", next);
                    }}
                  />
                </Field>
                <Field label="Valor" required>
                  <NumberInput
                    value={item.valor ?? ""}
                    onChange={(e) => {
                      const next = [...data.outrosCertificados.itens];
                      next[index] = {
                        ...next[index],
                        valor: Number(e.target.value),
                      };
                      update("outrosCertificados.itens", next);
                    }}
                  />
                </Field>
              </Grid>
              <button
                type="button"
                onClick={() =>
                  update(
                    "outrosCertificados.itens",
                    data.outrosCertificados.itens.filter((_, i) => i !== index),
                  )
                }
              >
                Remover
              </button>
            </div>
          ))}
        </div>
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
              <option value="SALARIO_MINIMO">
                Meio salário mínimo vigente
              </option>
              <option value="OUTRO">Outro</option>
            </Select>
          </Field>
          {data.assessoria.tipoValor === "OUTRO" ? (
            <Field label="Valor" required>
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
          <Field label="Valor mínimo" hint="Campo opcional">
            <NumberInput
              value={data.seguroInternacional.valorMinimo ?? ""}
              onChange={(e) =>
                update(
                  "seguroInternacional.valorMinimo",
                  Number(e.target.value),
                )
              }
            />
          </Field>
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
        <Field label="Modalidade" required>
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
    </Stack>
  );
}
