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
  role: "comercial" | "credenciamento" | "operacao";
  setor: string;
  ativo: boolean;
};

export interface CreateUserPayload {
  nome: string;
  email: string;
  password: string;
  role: "comercial" | "credenciamento" | "operacao";
  setor: string;
}


export type UpdateUserPayload = Partial<CreateUserPayload> & { password?: string };
