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

function emptyExportacaoServicos(): NonNullable<EscopoForm["servicos"]["exportacao"]> {
  return {
    despachoAduaneiroExportacao: {
      habilitado: false,
      tipoValor: "SALARIO_MINIMO",
      valor: null,
      responsavel: undefined,
    },
    preposto: {
      habilitado: false,
      valor: null,
      inclusoNoDesembaracoCasco: undefined,
    },
    certificadoOrigem: { habilitado: false, valor: null },
    certificadoFitossanitario: { habilitado: false, valor: null },
    outrosCertificados: { habilitado: false, itens: [] },
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
  };
}

export default function StepServicosExportacao({
  form,
  errors,
  onChange,
}: Props) {
  const data = form.servicos.exportacao ?? emptyExportacaoServicos();

  function setData(next: NonNullable<EscopoForm["servicos"]["exportacao"]>) {
    onChange({
      ...form,
      servicos: { ...form.servicos, exportacao: next },
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
        title="Despacho Aduaneiro Exportação"
        checked={data.despachoAduaneiroExportacao.habilitado}
        onToggle={(checked) =>
          update("despachoAduaneiroExportacao.habilitado", checked)
        }
      >
        <Grid columns={2}>
          <Field label="Tipo de valor" required>
            <Select
              value={data.despachoAduaneiroExportacao.tipoValor}
              onChange={(e) =>
                update("despachoAduaneiroExportacao.tipoValor", e.target.value)
              }
            >
              <option value="SALARIO_MINIMO">Um salário mínimo vigente</option>
              <option value="OUTRO">Outro</option>
            </Select>
          </Field>

          {data.despachoAduaneiroExportacao.tipoValor === "OUTRO" ? (
            <Field label="Valor" required>
              <NumberInput
                value={data.despachoAduaneiroExportacao.valor ?? ""}
                onChange={(e) =>
                  update(
                    "despachoAduaneiroExportacao.valor",
                    Number(e.target.value)
                  )
                }
              />
            </Field>
          ) : null}
        </Grid>

        <Field label="Responsável" required error={errors["despachoAduaneiroExportacao.responsavel"]}>
          <Select
            value={data.despachoAduaneiroExportacao.responsavel ?? ""}
            onChange={(e) => update("despachoAduaneiroExportacao.responsavel", e.target.value)}
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
          <Field label="Valor" required>
            <NumberInput
              value={data.preposto.valor ?? ""}
              onChange={(e) => update("preposto.valor", Number(e.target.value))}
            />
          </Field>

          <Field label="Incluso no serviço de desembaraço da Casco" required>
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
        title="Certificado de Origem"
        checked={data.certificadoOrigem.habilitado}
        onToggle={(checked) => update("certificadoOrigem.habilitado", checked)}
      >
        <Field label="Valor" required>
          <NumberInput
            value={data.certificadoOrigem.valor ?? ""}
            onChange={(e) =>
              update("certificadoOrigem.valor", Number(e.target.value))
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
        <Field label="Valor" required>
          <NumberInput
            value={data.certificadoFitossanitario.valor ?? ""}
            onChange={(e) =>
              update("certificadoFitossanitario.valor", Number(e.target.value))
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
          {(data.outrosCertificados.itens ?? []).map((item, index: number) => (
            <div
              key={index}
              style={{ border: "1px solid #eaecf0", borderRadius: 12, padding: 12 }}
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
                      next[index] = { ...next[index], valor: Number(e.target.value) };
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
                    data.outrosCertificados.itens.filter((_, i: number) => i !== index)
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
              value={data.assessoria.tipoValor}
              onChange={(e) => update("assessoria.tipoValor", e.target.value)}
            >
              <option value="SALARIO_MINIMO">Um salário mínimo vigente</option>
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
          <Field label="PTAX negociado" required>
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
        <Field label="Valor negociado" required>
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
        <Field label="Modalidade" required>
          <Select
            value={data.freteRodoviario.modalidade ?? ""}
            onChange={(e) => update("freteRodoviario.modalidade", e.target.value)}
          >
            <option value="">Selecione</option>
            <option value="SIM">Sim</option>
            <option value="CASO_A_CASO">Caso a caso</option>
          </Select>
        </Field>
      </ServicoToggleCard>

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

      <RegimeEspecialList
        items={data.regimeEspecial}
        onChange={(next) => update("regimeEspecial", next)}
      />
    </Stack>
  );
}
