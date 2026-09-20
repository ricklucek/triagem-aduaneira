import type { PrepostoLookupItem } from "@/lib/api/types/public-api";

export const MODAIS_LOCAL = [
  { value: "AEREO", label: "Aéreo" },
  { value: "MARITIMO", label: "Marítimo" },
  { value: "RODOVIARIO", label: "Rodoviário" },
] as const;

export type ModalLocal = (typeof MODAIS_LOCAL)[number]["value"];

export type UrfLocation = {
  value: string;
  label: string;
  cities: string[];
  modais: readonly ModalLocal[];
};

export const CASCO_URF_LOCATIONS: readonly UrfLocation[] = [
  {
    value: "0917900|Curitiba",
    label: "0917900 • Curitiba - Aéreo",
    cities: ["Curitiba"],
    modais: ["AEREO"],
  },
  {
    value: "0917800|Paranaguá",
    label: "0917800 • Paranaguá - Marítimo",
    cities: ["Paranaguá"],
    modais: ["MARITIMO"],
  },
  {
    value: "0817800|Santos",
    label: "0817800 • Santos - Marítimo",
    cities: ["Santos"],
    modais: ["MARITIMO"],
  },
  {
    value: "0927800|Itajaí/ Navegantes",
    label: "0927800 • Itajaí/ Navegantes - Marítimo",
    cities: ["Itajaí", "Navegantes"],
    modais: ["MARITIMO"],
  },
  {
    value: "0927700|Itapoá",
    label: "0927700 • Itapoá - Marítimo",
    cities: ["Itapoá"],
    modais: ["MARITIMO"],
  },
  {
    value: "1017500|Borja",
    label: "1017500 • Borja - Rodoviário",
    cities: ["Borja"],
    modais: ["RODOVIARIO"],
  },
  {
    value: "0927502|Imbituba - SC",
    label: "0927502 • Imbituba – SC - Marítimo",
    cities: ["Imbituba"],
    modais: ["MARITIMO"],
  },
  {
    value: "0817700|Viracopos/ Campinas",
    label: "0817700 • Viracopos/ Campinas - Aéreo",
    cities: ["Viracopos", "Campinas"],
    modais: ["AEREO"],
  },
  {
    value: "0817600|Guarulhos/ São Paulo",
    label: "0817600 • Guarulhos/ São Paulo - Aéreo",
    cities: ["Guarulhos", "São Paulo"],
    modais: ["AEREO"],
  },
  {
    value: "0917500|Foz do Iguaçu",
    label: "0917500 • Foz do Iguaçu - Rodoviário",
    cities: ["Foz do Iguaçu"],
    modais: ["RODOVIARIO"],
  },
  {
    value: "0517800|Salvador",
    label: "0517800 • Salvador – Aéreo e Marítimo",
    cities: ["Salvador"],
    modais: ["AEREO", "MARITIMO"],
  },
  {
    value: "0720100|Vitória - ES",
    label: "0720100 • Vitória – ES - Marítimo",
    cities: ["Vitória"],
    modais: ["MARITIMO"],
  },
  {
    value: "0617700|Belo Horizonte",
    label: "0617700 • Belo Horizonte - Aéreo",
    cities: ["Belo Horizonte"],
    modais: ["AEREO"],
  },
  {
    value: "0717700|Rio de Janeiro",
    label: "0717700 • Rio de Janeiro – Aéreo e Marítimo",
    cities: ["Rio de Janeiro"],
    modais: ["AEREO", "MARITIMO"],
  },
  {
    value: "0230155|Epitaciolândia / Acre",
    label: "0230155 • Epitaciolândia / Acre - Rodoviário",
    cities: ["Epitaciolândia"],
    modais: ["RODOVIARIO"],
  },
  {
    value: "1010253|Cersando / Bagé",
    label: "1010253 • Cersando / Bagé - Rodoviário",
    cities: ["Cersando", "Bagé"],
    modais: ["RODOVIARIO"],
  },
  {
    value: "0147600|Corumbá",
    label: "0147600 • Corumbá - Rodoviário",
    cities: ["Corumbá"],
    modais: ["RODOVIARIO"],
  },
  {
    value: "1017700|Porto de Rio Grande - RS",
    label: "1017700 • Porto de Rio Grande – RS - Marítimo",
    cities: ["Porto de Rio Grande"],
    modais: ["MARITIMO"],
  },
  {
    value: "0417902|Suape - PE",
    label: "0417902 • Suape – PE - Marítimo",
    cities: ["Suape"],
    modais: ["MARITIMO"],
  },
  {
    value: "1017801|Aeroporto Salgado Filho - Porto Alegre - RS",
    label: "1017801 • Aeroporto Salgado Filho - Porto Alegre – RS - Aéreo",
    cities: ["Porto Alegre"],
    modais: ["AEREO"],
  },
  {
    value: "0920200|Aeroporto Lauro Carneiro de Loyola - Joinville - SC",
    label:
      "0920200 • Aeroporto Lauro Carneiro de Loyola - Joinville – SC - Aéreo",
    cities: ["Joinville"],
    modais: ["AEREO"],
  },
  {
    value: "0617700|Betim - MG/Aeroporto de Confins",
    label: "0617700 • Betim - MG/Aeroporto de Confins - Aéreo",
    cities: ["Betim"],
    modais: ["AEREO"],
  },
  {
    value: "0317800|Pecém - CE",
    label: "0317800 • Pecém – CE - Marítimo",
    cities: ["Pecém"],
    modais: ["MARITIMO"],
  },
] as const;

// Kept as an alias while import drafts and legacy views use this name.
export const LOCAIS = CASCO_URF_LOCATIONS;

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function modalsForPrepostoType(type: string | null | undefined): ModalLocal[] {
  if (type === "AEROPORTO") return ["AEREO"];
  if (type === "PORTO") return ["MARITIMO"];
  if (type === "FRONTEIRA") return ["RODOVIARIO"];
  return MODAIS_LOCAL.map((modal) => modal.value);
}

export function buildExportUrfLocations(
  prepostos: readonly PrepostoLookupItem[] = [],
): UrfLocation[] {
  const result = [...CASCO_URF_LOCATIONS];
  const knownCities = new Set(
    CASCO_URF_LOCATIONS.flatMap((location) => location.cities.map(normalize)),
  );
  const dynamicValues = new Set<string>();

  for (const preposto of prepostos) {
    if (knownCities.has(normalize(preposto.cidade))) continue;

    const cityAndState = [preposto.cidade, preposto.uf]
      .filter(Boolean)
      .join(" / ");
    const description = preposto.descricaoLocal?.trim();
    const value = description
      ? `${cityAndState} — ${description}`
      : cityAndState;
    const normalizedValue = normalize(value);

    if (!value || dynamicValues.has(normalizedValue)) continue;
    dynamicValues.add(normalizedValue);
    result.push({
      value,
      label: `${value} • Localidade de preposto`,
      cities: [preposto.cidade],
      modais: modalsForPrepostoType(preposto.tipoLocal),
    });
  }

  return result;
}

export function filterUrfLocationsByModal(
  locations: readonly UrfLocation[],
  modais: readonly string[] = [],
) {
  return locations.filter(
    (location) =>
      modais.length === 0 ||
      location.modais.some((modal) => modais.includes(modal)),
  );
}
