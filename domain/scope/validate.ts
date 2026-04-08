import { ZodError } from "zod";
import {
  ContaBancariaSchema,
  ContatoSchema,
  EscopoSchema,
  ExportacaoSchema,
  ImportacaoSchema,
  ServicosExportacaoSchema,
  ServicosImportacaoSchema,
} from "./schema";
import { EscopoForm, EtapaFormulario, ResultadoValidacaoEtapa } from "./types";

function sanitizeByOperationType(data: EscopoForm): EscopoForm {
  const next = structuredClone(data);
  const hasImportacao = next.operacao.tipos.includes("IMPORTACAO");
  const hasExportacao = next.operacao.tipos.includes("EXPORTACAO");

  if (!hasImportacao) {
    next.operacao.importacao = undefined;
    next.servicos.importacao = undefined;
  }

  if (!hasExportacao) {
    next.operacao.exportacao = undefined;
    next.servicos.exportacao = undefined;
  }

  return next;
}

function zodErrorToMap(error: ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}

export function validarEtapa(
  etapa: EtapaFormulario,
  data: EscopoForm,
): ResultadoValidacaoEtapa {
  try {
    switch (etapa) {
      case "INFORMACOES_FIXAS":
        ContaBancariaSchema.parse(data.informacoesFixas.dadosBancariosCasco);
        if (
          !data.informacoesFixas.salarioMinimoVigente ||
          data.informacoesFixas.salarioMinimoVigente <= 0
        ) {
          return {
            ok: false,
            errors: {
              "informacoesFixas.salarioMinimoVigente":
                "Salário mínimo vigente é obrigatório",
            },
          };
        }
        return { ok: true, errors: {} };

      case "SOBRE_EMPRESA": {
        const sobreEmpresaSchema = EscopoSchema.shape.sobreEmpresa;
        sobreEmpresaSchema.parse(data.sobreEmpresa);
        return { ok: true, errors: {} };
      }

      case "CONTATOS":
        if (data.contatos.length === 0) {
          return {
            ok: false,
            errors: { contatos: "Informe ao menos um contato" },
          };
        }

        data.contatos.forEach((contato) => ContatoSchema.parse(contato));
        return { ok: true, errors: {} };

      case "OPERACAO":
        if (data.operacao.tipos.length === 0) {
          return {
            ok: false,
            errors: { "operacao.tipos": "Selecione ao menos uma operação" },
          };
        }
        return { ok: true, errors: {} };

      case "IMPORTACAO":
        if (!data.operacao.tipos.includes("IMPORTACAO"))
          return { ok: true, errors: {} };
        if (!data.operacao.importacao) {
          return {
            ok: false,
            errors: {
              "operacao.importacao": "Bloco de importação é obrigatório",
            },
          };
        }
        ImportacaoSchema.parse(data.operacao.importacao);
        return { ok: true, errors: {} };

      case "SERVICOS_IMPORTACAO":
        if (!data.operacao.tipos.includes("IMPORTACAO"))
          return { ok: true, errors: {} };
        if (!data.servicos.importacao) {
          return {
            ok: false,
            errors: {
              "servicos.importacao": "Serviços de importação são obrigatórios",
            },
          };
        }
        ServicosImportacaoSchema.parse(data.servicos.importacao);
        return { ok: true, errors: {} };

      case "EXPORTACAO":
        if (!data.operacao.tipos.includes("EXPORTACAO"))
          return { ok: true, errors: {} };
        if (!data.operacao.exportacao) {
          return {
            ok: false,
            errors: {
              "operacao.exportacao": "Bloco de exportação é obrigatório",
            },
          };
        }
        ExportacaoSchema.parse(data.operacao.exportacao);
        return { ok: true, errors: {} };

      case "SERVICOS_EXPORTACAO":
        if (!data.operacao.tipos.includes("EXPORTACAO"))
          return { ok: true, errors: {} };
        if (!data.servicos.exportacao) {
          return {
            ok: false,
            errors: {
              "servicos.exportacao": "Serviços de exportação são obrigatórios",
            },
          };
        }
        ServicosExportacaoSchema.parse(data.servicos.exportacao);
        return { ok: true, errors: {} };

      case "FINANCEIRO":
        ContaBancariaSchema.parse(
          data.financeiro.dadosBancariosClienteDevolucaoSaldo,
        );
        if (!data.financeiro.observacoesFinanceiro?.trim()) {
          return {
            ok: false,
            errors: {
              "financeiro.observacoesFinanceiro":
                "Observações do financeiro são obrigatórias",
            },
          };
        }
        return { ok: true, errors: {} };

      default:
        return { ok: true, errors: {} };
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, errors: zodErrorToMap(error) };
    }
    throw error;
  }
}

export function validarFormularioCompleto(
  data: EscopoForm,
): ResultadoValidacaoEtapa {
  try {
    EscopoSchema.parse(sanitizeByOperationType(data));
    return { ok: true, errors: {} };
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, errors: zodErrorToMap(error) };
    }
    throw error;
  }
}
