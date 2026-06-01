export interface MetricCard {
  label: string;
  value: number;
  unit?: string;
}

export interface GroupedMetric {
  group: string;
  total: number;
}

export interface AdminDashboardResponse {
  createdLastMonth: number;
  outdatedScopes: number;
  scopesByPerson: GroupedMetric[];
  scopesBySector: GroupedMetric[];
  comercialAveragePrice: number;
  totalScopes: number;
  totalEnabledServices?: number;
  totalDistinctServices?: number;
  totalServicesAmount?: number;
}

export interface AdminDashboardMetricsFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdminDashboardMetricsResponse {
  totalScopes: number;
  totalEnabledServices: number;
  totalDistinctServices: number;
  totalServicesAmount: number;
  outdatedScopes: number;
  monthCreatedScopes: number;
  weekCreatedScopes: number;
}

export interface ScopeByUserItem {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  userSetor: string;
  totalScopes: number;
  scopes?: Array<{
    id: string;
    status: string;
    clientId: string;
    clientName: string;
    clientCnpj: string;
    responsibleUserId: string | null;
    createdAt: string;
    updatedAt: string;
    lastPublishedAt: string | null;
  }>;
  scopesLimit?: number;
  scopesTruncated?: boolean;
}

export interface ScopesByUserFilters extends AdminDashboardMetricsFilters {
  groupBy: string | undefined
  includeScopes?: boolean;
  scopesLimitPerUser?: number;
}

export interface ScopesByUserResponse {
  items: ScopeByUserItem[];
  totalUsers: number;
  totalScopes: number;
}

export interface ServiceMetricItem {
  serviceCatalogId: string;
  serviceCode: string;
  serviceName: string;
  operationType: "IMPORTACAO" | "EXPORTACAO" | "AMBOS";
  currency: string;
  totalOccurrences: number;
  occurrencesPercentage: number;
  totalScopes: number;
  totalAmount: number;
  averageAmount: number | null;
  minAmount: number | null;
  maxAmount: number | null;
}

export interface ServicesMetricsFilters extends AdminDashboardMetricsFilters {
  operationType?: "IMPORTACAO" | "EXPORTACAO" | "AMBOS";
  serviceCode?: string;
}

export interface ServicesMetricsResponse {
  items: ServiceMetricItem[];
  totalServices: number;
  totalOccurrences: number;
  totalAmount: number;
}


export interface ServiceByScopeItem {
  scopeServiceId: string;
  scopeId: string;
  scopeStatus: string;
  scopeCreatedAt: string;
  scopeUpdatedAt: string;
  createdById: string;
  createdByName: string;
  clientId: string;
  clientName: string;
  clientCnpj: string;
  serviceCatalogId: string;
  serviceCode: string;
  serviceName: string;
  operationType: "IMPORTACAO" | "EXPORTACAO" | "AMBOS";
  pricingType: string;
  amount: number;
  currency: string;
  serviceResponsibleUserId: string | null;
  extraData: Record<string, unknown>;
}

export interface ServicesByScopeFilters extends ServicesMetricsFilters {
  createdById?: string;
  responsibleUserId?: string;
  clientId?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface ServicesByScopeResponse {
  items: ServiceByScopeItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface ComercialDashboardResponse {
  responsibleScopes: number;
  salesAveragePrice: number;
  createdLastMonthAsResponsible: number;
}

export interface CredenciamentoDashboardResponse {
  createdLastMonth: number;
  expiredScopes: number;
  createdByUser: number;
  waitingAdjustment: number;
}

export interface OperacaoDashboardResponse {
  responsibleScopes: number;
  createdLastMonth: number;
  waitingAdjustment: number;
}

export type UserSummary = {
  id: string;
  nome: string;
  email: string;
  role: "administrador" | "comercial" | "credenciamento" | "operacao";
  setor: string;
  ativo: boolean;
};

export interface CreateUserPayload {
  nome: string;
  email: string;
  password: string;
  role: "comercial" | "credenciamento" | "operacao" | "administrador";
  setor: string;
}

export type UpdateUserPayload = Partial<CreateUserPayload> & { password?: string };
