export const EntryLocations = [
  { id: "VCP_VIRACOPOS", label: "Viracopos (VCP)", code: "URF-VCP" },
  { id: "GRU_GUARULHOS", label: "Guarulhos (GRU)", code: "URF-GRU" },
  { id: "CWB_AFONSO_PENA", label: "Afonso Pena (CWB)", code: "URF-CWB" },
  { id: "PRG_PARANAGUA", label: "Paranaguá", code: "URF-PRG" },
  { id: "ITP_ITAPOA", label: "Itapoá", code: "URF-ITP" },
  { id: "ITJ_ITAJAI", label: "Itajaí", code: "URF-ITJ" },
  { id: "NVT_NAVEGANTES", label: "Navegantes", code: "URF-NVT" },
] as const;

export const ReleaseWarehouses = [
  { id: "ZP", label: "Zona Primária", code: "ZP" },
  { id: "ZA", label: "Zona Secundária (Armazém)", code: "ZA" },
  {
    id: "MESMO_LOCAL_ENTRADA",
    label: "Normalmente no local de entrada",
    code: "AUTO",
  },
] as const;

// Export
export const ExportPortsAndBorders = [
  { id: "PORTO_SANTOS", label: "Porto de Santos", code: "BRSSZ" },
  { id: "PORTO_PARANAGUA", label: "Porto de Paranaguá", code: "BRPNG" },
  { id: "FRONTEIRA_FOZ", label: "Foz do Iguaçu", code: "BRFZI" },
  { id: "AEROPORTO_GRU", label: "Aeroporto de Guarulhos (GRU)", code: "BRGRU" },
] as const;
