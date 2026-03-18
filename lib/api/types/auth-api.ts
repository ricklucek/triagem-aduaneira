export type UserRole = "admin" | "comercial" | "credenciamento" | "operacao";

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  setor?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RefreshResponse {
  tokens: AuthTokens;
}
