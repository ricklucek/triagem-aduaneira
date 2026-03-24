import { API_ROUTES } from "@/lib/api/config/routes";
import { http } from "@/lib/api/config/http";
import type { PrepostoLookupResponse, PublicCompanyLookupResponse } from "@/lib/api/types/public-api";
import axios from "axios";

export const publicApi = {
  async lookupCompanyByCnpj(cnpj: string): Promise<PublicCompanyLookupResponse> {

    const { data } = await axios.create({}).get<PublicCompanyLookupResponse>(API_ROUTES.public.cnpjLookup(cnpj));
      
    return data;
  },

  async lookupPrepostos(params: { cidade: string; operacao: "IMPORTACAO" | "EXPORTACAO" }): Promise<PrepostoLookupResponse> {
    const { data } = await http.get<PrepostoLookupResponse>(API_ROUTES.public.prepostosLookup, { params });
    return data;
  },
};
