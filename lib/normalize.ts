export function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function splitList(input: string): string[] {
  return input
    .split(/[\n,;|]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseYesNo(input: string): boolean | null {
  const v = normalizeText(input);
  if (["sim", "s", "yes", "y", "true", "1"].includes(v)) return true;
  if (["nao", "não", "n", "no", "false", "0"].includes(v)) return false;
  return null;
}

export function parseCnpjLoose(input: string): string {
  // MVP: mantém apenas dígitos; depois você pode formatar no front.
  const digits = input.replace(/\D/g, "");
  return digits;
}

export function parseOperationTypes(input: string): ("IMPORTACAO" | "EXPORTACAO")[] {
  const v = normalizeText(input);

  const out = new Set<"IMPORTACAO" | "EXPORTACAO">();

  // aceita variações (importação/importacao/import, exportação/exportacao/export)
  if (v.includes("import")) out.add("IMPORTACAO");
  if (v.includes("export")) out.add("EXPORTACAO");

  // casos: "impo e expo", "ambas", "importacao/exportacao"
  if (v.includes("ambas") || v.includes("as duas") || v.includes("duas")) {
    out.add("IMPORTACAO");
    out.add("EXPORTACAO");
  }

  return Array.from(out);
}

export function parseNcmList(input: string): string[] {
  // aceita "8471.30.12; 3926.90.90" etc
  return splitList(input).map((x) => x.replace(/\s+/g, ""));
}