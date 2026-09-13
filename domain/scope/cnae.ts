const CNAE_CANONICAL_PATTERN = /^\d{4}-\d\/\d{2}\s+-\s+\S.+$/;

export function formatCnaeCode(value: string | number | null | undefined) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length !== 7) return String(value ?? "").trim();
  return `${digits.slice(0, 4)}-${digits.slice(4, 5)}/${digits.slice(5)}`;
}

export function formatCnae(
  code: string | number | null | undefined,
  description: string | null | undefined,
) {
  const formattedCode = formatCnaeCode(code);
  const normalizedDescription = String(description ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!formattedCode) return normalizedDescription;
  if (!normalizedDescription) return formattedCode;
  return `${formattedCode} - ${normalizedDescription}`;
}

export function isCanonicalCnae(value: string) {
  return CNAE_CANONICAL_PATTERN.test(value.trim());
}

export function areCanonicalCnaeLines(value?: string | null) {
  if (!value?.trim()) return true;
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .every(isCanonicalCnae);
}
