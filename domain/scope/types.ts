import { z } from "zod";
import { EscopoSchema } from "./schema";

export type EscopoForm = z.infer<typeof EscopoSchema>;

export type EtapaFormulario =
  | "INFORMACOES_FIXAS"
  | "SOBRE_EMPRESA"
  | "CONTATOS"
  | "OPERACAO"
  | "IMPORTACAO"
  | "SERVICOS_IMPORTACAO"
  | "EXPORTACAO"
  | "SERVICOS_EXPORTACAO"
  | "FINANCEIRO";

export type ResultadoValidacaoEtapa = {
  ok: boolean;
  errors: Record<string, string>;
};