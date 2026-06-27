import { z } from "zod";
import { EscopoSchema } from "./schema";

export type EscopoForm = z.infer<typeof EscopoSchema>;

export type EtapaFormulario =
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

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
