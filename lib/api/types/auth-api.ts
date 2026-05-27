export type UserRole = "admin" | "comercial" | "credenciamento" | "operacao";

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
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
  user: IUser;
  tokens: AuthTokens;
}

export interface RefreshResponse {
  tokens: AuthTokens;
}
