import { API_ROUTES } from "@/lib/api/config/routes";
import { http } from "@/lib/api/config/http";
import type {
  PrepostoAdmin,
  PrepostoContact,
  PrepostoContactPayload,
  PrepostoCredential,
  PrepostoCredentialListResponse,
  PrepostoCredentialPayload,
  PrepostoListResponse,
  PrepostoLocality,
  PrepostoLocalityPayload,
  PrepostoPayload,
  PrepostoTariff,
  PrepostoTariffPayload,
} from "@/lib/api/types/preposto-api";

export const prepostosApi = {
  async list(params?: {
    q?: string;
    uf?: string;
    operacao?: string;
    ativo?: boolean;
  }) {
    const { data } = await http.get<PrepostoListResponse>(
      API_ROUTES.prepostos.list,
      {
        params,
      },
    );
    return data;
  },
  async create(payload: PrepostoPayload) {
    const { data } = await http.post<PrepostoAdmin>(
      API_ROUTES.prepostos.list,
      payload,
    );
    return data;
  },
  async get(id: string) {
    const { data } = await http.get<PrepostoAdmin>(
      API_ROUTES.prepostos.detail(id),
    );
    return data;
  },
  async update(id: string, payload: Partial<PrepostoPayload>) {
    const { data } = await http.patch<PrepostoAdmin>(
      API_ROUTES.prepostos.detail(id),
      payload,
    );
    return data;
  },
  async remove(id: string) {
    await http.delete(API_ROUTES.prepostos.detail(id));
  },
  async createContact(prepostoId: string, payload: PrepostoContactPayload) {
    const { data } = await http.post<PrepostoContact>(
      API_ROUTES.prepostos.contacts(prepostoId),
      payload,
    );
    return data;
  },
  async updateContact(
    prepostoId: string,
    id: string,
    payload: Partial<PrepostoContactPayload>,
  ) {
    const { data } = await http.patch<PrepostoContact>(
      API_ROUTES.prepostos.contact(prepostoId, id),
      payload,
    );
    return data;
  },
  async removeContact(prepostoId: string, id: string) {
    await http.delete(API_ROUTES.prepostos.contact(prepostoId, id));
  },
  async createLocality(prepostoId: string, payload: PrepostoLocalityPayload) {
    const { data } = await http.post<PrepostoLocality>(
      API_ROUTES.prepostos.localities(prepostoId),
      payload,
    );
    return data;
  },
  async updateLocality(
    prepostoId: string,
    id: string,
    payload: Partial<PrepostoLocalityPayload>,
  ) {
    const { data } = await http.patch<PrepostoLocality>(
      API_ROUTES.prepostos.locality(prepostoId, id),
      payload,
    );
    return data;
  },
  async removeLocality(prepostoId: string, id: string) {
    await http.delete(API_ROUTES.prepostos.locality(prepostoId, id));
  },
  async createTariff(
    prepostoId: string,
    localityId: string,
    payload: PrepostoTariffPayload,
  ) {
    const { data } = await http.post<PrepostoTariff>(
      API_ROUTES.prepostos.tariffs(prepostoId, localityId),
      payload,
    );
    return data;
  },
  async updateTariff(
    prepostoId: string,
    localityId: string,
    id: string,
    payload: Partial<PrepostoTariffPayload>,
  ) {
    const { data } = await http.patch<PrepostoTariff>(
      API_ROUTES.prepostos.tariff(prepostoId, localityId, id),
      payload,
    );
    return data;
  },
  async removeTariff(prepostoId: string, localityId: string, id: string) {
    await http.delete(API_ROUTES.prepostos.tariff(prepostoId, localityId, id));
  },
  async listCredentials(params?: { q?: string; ativo?: boolean }) {
    const { data } = await http.get<PrepostoCredentialListResponse>(
      API_ROUTES.prepostos.credentials,
      { params },
    );
    return data;
  },
  async createCredential(payload: PrepostoCredentialPayload) {
    const { data } = await http.post<PrepostoCredential>(
      API_ROUTES.prepostos.credentials,
      payload,
    );
    return data;
  },
  async updateCredential(
    id: string,
    payload: Partial<PrepostoCredentialPayload>,
  ) {
    const { data } = await http.patch<PrepostoCredential>(
      API_ROUTES.prepostos.credential(id),
      payload,
    );
    return data;
  },
  async removeCredential(id: string) {
    await http.delete(API_ROUTES.prepostos.credential(id));
  },
  async linkCredential(
    prepostoId: string,
    localityId: string,
    credentialId: string,
  ) {
    const { data } = await http.post<PrepostoAdmin>(
      API_ROUTES.prepostos.credentialBindings(prepostoId, localityId),
      { credenciado_id: credentialId },
    );
    return data;
  },
  async unlinkCredential(
    prepostoId: string,
    localityId: string,
    credentialId: string,
  ) {
    await http.delete(
      API_ROUTES.prepostos.credentialBinding(
        prepostoId,
        localityId,
        credentialId,
      ),
    );
  },
};
