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

function emptyExportacaoServicos() {
  return {
    despachoAduaneiroExportacao: { habilitado: false, tipoValor: "SALARIO_MINIMO", valor: null },
    preposto: { habilitado: false, valor: null, inclusoNoDesembaracoCasco: undefined },
    certificadoOrigem: { habilitado: false, valor: null },
    certificadoFitossanitario: { habilitado: false, valor: null },
    outrosCertificados: { habilitado: false, especificacaoCertificado: "", valor: null },
    assessoria: { habilitado: false, tipoValor: "SALARIO_MINIMO", valor: null },
    freteInternacional: { habilitado: false, ptaxNegociado: "", percentual: null },
    seguroInternacional: { habilitado: false, valorNegociado: null, descricaoComplementar: "" },
    freteRodoviario: { habilitado: false, modalidade: undefined },
    regimeEspecial: [],
  };
}

export default function StepServicosExportacao({
  form,
  errors,
  onChange,
}: Props) {
  const data = form.servicos.exportacao ?? emptyExportacaoServicos();

  function setData(next: any) {
    onChange({
      ...form,
      servicos: { ...form.servicos, exportacao: next },
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
        <Grid columns={2}>
          <Field
            label="Especificação do certificado"
            required
            error={errors["outrosCertificados.especificacaoCertificado"]}
          >
            <TextInput
              value={data.outrosCertificados.especificacaoCertificado ?? ""}
              onChange={(e) =>
                update("outrosCertificados.especificacaoCertificado", e.target.value)
              }
            />
          </Field>

          <Field
            label="Valor"
            required
            error={errors["outrosCertificados.valor"]}
          >
            <NumberInput
              value={data.outrosCertificados.valor ?? ""}
              onChange={(e) =>
                update("outrosCertificados.valor", Number(e.target.value))
              }
            />
          </Field>
        </Grid>
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

          <Field label="Percentual" required>
            <NumberInput
              value={data.freteInternacional.percentual ?? ""}
              onChange={(e) =>
                update("freteInternacional.percentual", Number(e.target.value))
              }
            />
          </Field>
        </Grid>
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

        <Field label="Descrição complementar" required>
          <TextArea
            value={data.seguroInternacional.descricaoComplementar ?? ""}
            onChange={(e) =>
              update("seguroInternacional.descricaoComplementar", e.target.value)
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
            onChange={(e) => update("freteRodoviario.modalidade", e.target.value)}
          >
            <option value="">Selecione</option>
            <option value="SIM">Sim</option>
            <option value="CASO_A_CASO">Caso a caso</option>
          </Select>
        </Field>
      </ServicoToggleCard>

      <RegimeEspecialList
        items={data.regimeEspecial}
        onChange={(next) => update("regimeEspecial", next)}
      />
    </Stack>
  );
}