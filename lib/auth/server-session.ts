import { cookies } from "next/headers";
import type { AuthSession } from "@/lib/auth/session-storage";

export const AUTH_SESSION_COOKIE = "triagem.auth.session";

export async function getServerAuthSession(): Promise<AuthSession | null> {
  const store = await cookies();
  const raw = store.get(AUTH_SESSION_COOKIE)?.value;

  if (!raw) return null;

  try {
    return JSON.parse(decodeURIComponent(raw)) as AuthSession;
  } catch {
    return null;
  }
}
