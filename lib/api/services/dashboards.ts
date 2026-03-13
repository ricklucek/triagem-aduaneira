import { API_ROUTES } from "@/lib/api/config/routes";
import { http } from "@/lib/api/config/http";
import type {
  AdminDashboardResponse,
  ComercialDashboardResponse,
  CredenciamentoDashboardResponse,
  OperacaoDashboardResponse,
} from "@/lib/api/types/dashboard-api";

export const dashboardApi = {
  async getAdminMetrics(): Promise<AdminDashboardResponse> {
    const { data } = await http.get<AdminDashboardResponse>(API_ROUTES.dashboards.admin);
    return data;
  },

  async getComercialMetrics(): Promise<ComercialDashboardResponse> {
    const { data } = await http.get<ComercialDashboardResponse>(API_ROUTES.dashboards.comercial);
    return data;
  },

  async getCredenciamentoMetrics(): Promise<CredenciamentoDashboardResponse> {
    const { data } = await http.get<CredenciamentoDashboardResponse>(API_ROUTES.dashboards.credenciamento);
    return data;
  },

  async getOperacaoMetrics(): Promise<OperacaoDashboardResponse> {
    const { data } = await http.get<OperacaoDashboardResponse>(API_ROUTES.dashboards.operacao);
    return data;
  },
};
