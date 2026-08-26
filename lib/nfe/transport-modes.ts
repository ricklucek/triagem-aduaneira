export const NFE_TRANSPORT_MODES = [
  { code: "1", label: "Marítima" },
  { code: "2", label: "Fluvial" },
  { code: "3", label: "Lacustre" },
  { code: "4", label: "Aérea" },
  { code: "5", label: "Postal" },
  { code: "6", label: "Ferroviária" },
  { code: "7", label: "Rodoviária" },
  { code: "8", label: "Conduto" },
  { code: "9", label: "Meios próprios" },
  { code: "10", label: "Entrada/saída ficta" },
  { code: "11", label: "Courier" },
  { code: "12", label: "Em mãos" },
  { code: "13", label: "Por reboque" },
] as const;

export function nfeTransportModeLabel(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  const code = String(value);
  const transportMode = NFE_TRANSPORT_MODES.find((item) => item.code === code);
  return transportMode ? `${transportMode.code} — ${transportMode.label}` : code;
}
