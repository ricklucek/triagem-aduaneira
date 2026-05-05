import { API_ROUTES } from "@/lib/api/config/routes";
import { http } from "@/lib/api/config/http";
import type {
  AdminDashboardMetricsFilters,
  AdminDashboardMetricsResponse,
  AdminDashboardResponse,
  ComercialDashboardResponse,
  CredenciamentoDashboardResponse,
  OperacaoDashboardResponse,
  ScopesByUserFilters,
  ScopesByUserResponse,
  ServicesByScopeFilters,
  ServicesByScopeResponse,
  ServicesMetricsFilters,
  ServicesMetricsResponse,
} from "@/lib/api/types/dashboard-api";

export const dashboardApi = {
  async getAdminMetrics(): Promise<AdminDashboardResponse> {
    const { data } = await http.get<AdminDashboardResponse>(
      API_ROUTES.dashboards.admin,
    );
    return data;
  },

  async getAdminDashboardMetrics(
    params?: AdminDashboardMetricsFilters,
  ): Promise<AdminDashboardMetricsResponse> {
    const { data } = await http.get<AdminDashboardMetricsResponse>(
      API_ROUTES.dashboards.adminMetrics,
      { params: { ...params } },
    );
    return data;
  },

  async getAdminScopesByUser(
    params?: ScopesByUserFilters,
  ): Promise<ScopesByUserResponse> {
    const { data } = await http.get<ScopesByUserResponse>(
      API_ROUTES.dashboards.adminScopesByUser,
      { params: { ...params } },
    );
    return data;
  },

  async getAdminServicesMetrics(
    params?: ServicesMetricsFilters,
  ): Promise<ServicesMetricsResponse> {
    const { data } = await http.get<ServicesMetricsResponse>(
      API_ROUTES.dashboards.adminServices,
      { params: { ...params } },
    );
    return data;
  },


  async getAdminServicesByScope(
    params?: ServicesByScopeFilters,
  ): Promise<ServicesByScopeResponse> {
    const { data } = await http.get<ServicesByScopeResponse>(
      API_ROUTES.dashboards.adminServicesByScope,
      { params: { ...params } },
    );
    return data;
  },

  async getComercialMetrics(): Promise<ComercialDashboardResponse> {
    const { data } = await http.get<ComercialDashboardResponse>(
      API_ROUTES.dashboards.comercial,
    );
    return data;
  },

  async getCredenciamentoMetrics(): Promise<CredenciamentoDashboardResponse> {
    const { data } = await http.get<CredenciamentoDashboardResponse>(
      API_ROUTES.dashboards.credenciamento,
    );
    return data;
  },

  async getOperacaoMetrics(): Promise<OperacaoDashboardResponse> {
    const { data } = await http.get<OperacaoDashboardResponse>(
      API_ROUTES.dashboards.operacao,
    );
    return data;
  },
};
