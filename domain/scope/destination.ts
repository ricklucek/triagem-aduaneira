export const PRIMARY_DESTINATION_OPTIONS = [
  { value: "REVENDA", label: "Revenda" },
  { value: "CONSUMO", label: "Consumo" },
] as const;

export const CONSUMPTION_SUBTYPE_OPTIONS = [
  {
    value: "ATIVO_IMOBILIZADO_FIXO",
    label: "Ativo imobilizado/fixo",
  },
  {
    value: "INSUMOS_PARA_INDUSTRIALIZACAO",
    label: "Insumos para industrialização",
  },
  { value: "USO_E_CONSUMO", label: "Uso e consumo" },
] as const;

export const ICMS_DESTINATION_LABELS = {
  REVENDA: "Revenda",
  INDUSTRIALIZACAO: "Industrialização",
  USO_E_CONSUMO: "Uso e consumo",
  ATIVO_IMOBILIZADO: "Ativo imobilizado",
} as const;

export type PrimaryDestination =
  (typeof PRIMARY_DESTINATION_OPTIONS)[number]["value"];
export type ConsumptionSubtype =
  (typeof CONSUMPTION_SUBTYPE_OPTIONS)[number]["value"];
export type IcmsDestination = keyof typeof ICMS_DESTINATION_LABELS;

export function icmsDestinationLabel(value: string) {
  return value in ICMS_DESTINATION_LABELS
    ? ICMS_DESTINATION_LABELS[value as IcmsDestination]
    : value;
}

const LEGACY_DESTINATION_TO_SUBTYPE: Record<string, ConsumptionSubtype> = {
  INDUSTRIALIZACAO: "INSUMOS_PARA_INDUSTRIALIZACAO",
  USO_E_CONSUMO: "USO_E_CONSUMO",
  ATIVO_IMOBILIZADO: "ATIVO_IMOBILIZADO_FIXO",
};

const SUBTYPE_TO_ICMS_DESTINATION: Record<ConsumptionSubtype, IcmsDestination> =
  {
    ATIVO_IMOBILIZADO_FIXO: "ATIVO_IMOBILIZADO",
    INSUMOS_PARA_INDUSTRIALIZACAO: "INDUSTRIALIZACAO",
    USO_E_CONSUMO: "USO_E_CONSUMO",
  };

export function getPrimaryDestinations(
  destinations: readonly string[] = [],
  consumptionSubtypes: readonly string[] = [],
) {
  const selected: PrimaryDestination[] = [];
  if (destinations.includes("REVENDA")) selected.push("REVENDA");
  if (
    destinations.includes("CONSUMO") ||
    consumptionSubtypes.length > 0 ||
    destinations.some((value) => LEGACY_DESTINATION_TO_SUBTYPE[value])
  ) {
    selected.push("CONSUMO");
  }
  return selected;
}

export function getConsumptionSubtypes(
  destinations: readonly string[] = [],
  consumptionSubtypes: readonly string[] = [],
) {
  const validSubtypes = new Set<ConsumptionSubtype>(
    CONSUMPTION_SUBTYPE_OPTIONS.map((option) => option.value),
  );
  const selected = new Set<ConsumptionSubtype>();

  for (const value of consumptionSubtypes) {
    if (validSubtypes.has(value as ConsumptionSubtype)) {
      selected.add(value as ConsumptionSubtype);
    }
  }
  for (const destination of destinations) {
    const legacySubtype = LEGACY_DESTINATION_TO_SUBTYPE[destination];
    if (legacySubtype) selected.add(legacySubtype);
  }

  return Array.from(selected);
}

export function getIcmsDestinations(
  destinations: readonly string[] = [],
  consumptionSubtypes: readonly string[] = [],
) {
  const selected: IcmsDestination[] = destinations.includes("REVENDA")
    ? ["REVENDA"]
    : [];
  const consumptionDestinations = getConsumptionSubtypes(
    destinations,
    consumptionSubtypes,
  )
    .map((value) => SUBTYPE_TO_ICMS_DESTINATION[value])
    .filter((value): value is IcmsDestination => Boolean(value));

  return Array.from(new Set([...selected, ...consumptionDestinations]));
}

export function includesIcmsDestination(
  destinations: readonly string[] = [],
  consumptionSubtypes: readonly string[] = [],
  value: string,
) {
  return getIcmsDestinations(destinations, consumptionSubtypes).some(
    (destination) => destination === value,
  );
}

export function destinationLabels(
  destinations: readonly string[] = [],
  consumptionSubtypes: readonly string[] = [],
) {
  return getPrimaryDestinations(destinations, consumptionSubtypes).map(
    (value) =>
      PRIMARY_DESTINATION_OPTIONS.find((option) => option.value === value)
        ?.label ?? value,
  );
}

export function consumptionSubtypeLabels(
  destinations: readonly string[] = [],
  consumptionSubtypes: readonly string[] = [],
) {
  return getConsumptionSubtypes(destinations, consumptionSubtypes).map(
    (value) =>
      CONSUMPTION_SUBTYPE_OPTIONS.find((option) => option.value === value)
        ?.label ?? value,
  );
}
