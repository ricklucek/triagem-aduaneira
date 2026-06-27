import { z } from "zod";
import type { DeepPartial, EscopoForm } from "./types";

export const TemplateScopeSchema = z.object({
  name: z.string().trim().min(1, "Nome do template é obrigatório"),
  description: z.string().trim().optional().default(""),
  draft: z.custom<DeepPartial<EscopoForm>>().optional(),
});

export type TemplateScopeForm = z.infer<typeof TemplateScopeSchema>;
