import { normalizeText } from "@/lib/normalize";

export type TargetPath =
  | "client.cnpj"
  | "client.razaoSocial"
  | "contacts[0].email"
  | "operation.types[]"
  | "importSection.ncm[]"
  | "importSection.entryLocations[]"
  | "importSection.releaseWarehouses[]"
  | "importSection.liLpco.enabled"
  | "importSection.liLpco.anuencias[]"
  | "exportSection.ncm[]"
  | "exportSection.departureLocations[]";

export type Guess = { path: TargetPath | null; confidence: number; reason?: string };

function includesAny(hay: string, needles: string[]) {
  return needles.some((n) => hay.includes(n));
}

export function guessTargetPath(extractedKey: string, extractedValue: string): Guess {
  const k = normalizeText(extractedKey);
  const v = normalizeText(extractedValue);

  // CNPJ
  if (includesAny(k, ["cnpj"])) return { path: "client.cnpj", confidence: 0.95, reason: "key: cnpj" };
  if (v.replace(/\D/g, "").length === 14 && includesAny(k, ["doc", "documento", "cadastro"])) {
    return { path: "client.cnpj", confidence: 0.7, reason: "14 dígitos" };
  }

  // Razão social
  if (includesAny(k, ["razao social", "razão social", "razao_social", "empresa"])) {
    return { path: "client.razaoSocial", confidence: 0.85, reason: "key: razão social" };
  }

  // E-mail
  if (includesAny(k, ["email", "e-mail", "mail"])) return { path: "contacts[0].email", confidence: 0.9, reason: "key: email" };
  if (v.includes("@")) return { path: "contacts[0].email", confidence: 0.65, reason: "value contém @" };

  // Operação
  if (includesAny(k, ["operacao", "operação", "tipo operacao", "tipo operação"])) {
    return { path: "operation.types[]", confidence: 0.9, reason: "key: operação" };
  }
  if (includesAny(v, ["import", "export"])) {
    return { path: "operation.types[]", confidence: 0.6, reason: "value contém import/export" };
  }

  // NCM (import/export)
  if (includesAny(k, ["ncm"])) {
    if (includesAny(k, ["export", "exp"])) return { path: "exportSection.ncm[]", confidence: 0.8, reason: "key: ncm + export" };
    if (includesAny(k, ["import", "imp"])) return { path: "importSection.ncm[]", confidence: 0.8, reason: "key: ncm + import" };
    return { path: "importSection.ncm[]", confidence: 0.65, reason: "key: ncm (default import)" };
  }
  // se tiver cara de NCM (muitos dígitos e pontos) e não souber qual seção
  if (/[0-9]{4}\.[0-9]{2}\.[0-9]{2}/.test(extractedValue) || /[0-9]{8}/.test(extractedValue.replace(/\D/g, ""))) {
    return { path: "importSection.ncm[]", confidence: 0.55, reason: "padrão de NCM" };
  }

  // Locais import
  if (includesAny(k, ["local entrada", "entrada", "urf"])) {
    return { path: "importSection.entryLocations[]", confidence: 0.75, reason: "key: entrada/urf" };
  }
  if (includesAny(k, ["armazem", "armazém", "liberacao", "liberação"])) {
    return { path: "importSection.releaseWarehouses[]", confidence: 0.75, reason: "key: armazém/liberação" };
  }

  // Portos/fronteiras export
  if (includesAny(k, ["porto", "portos", "fronteira", "fronteiras", "saida", "saída"])) {
    return { path: "exportSection.departureLocations[]", confidence: 0.75, reason: "key: porto/fronteira" };
  }

  // LI/LPCO
  if (includesAny(k, ["li", "lpco", "li/lpco", "licenca", "licença"])) {
    // se o valor parece sim/não, mapeia para enabled
    if (includesAny(v, ["sim", "nao", "não", "true", "false", "1", "0"])) {
      return { path: "importSection.liLpco.enabled", confidence: 0.8, reason: "key: li/lpco + bool" };
    }
    return { path: "importSection.liLpco.enabled", confidence: 0.6, reason: "key: li/lpco" };
  }
  if (includesAny(k, ["anuencia", "anuências", "anuencias", "orgao", "órgão", "orgãos"])) {
    return { path: "importSection.liLpco.anuencias[]", confidence: 0.8, reason: "key: anuências/órgãos" };
  }

  return { path: null, confidence: 0, reason: "sem match" };
}