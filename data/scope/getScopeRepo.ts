import { ScopeRepo } from "./ScopeRepo";
import { ScopeRepoSeed } from "./ScopeRepo.seed";
import { ScopeRepoLocal } from "./ScopeRepo.local";

let singleton: ScopeRepo | null = null;

export function getScopeRepo(): ScopeRepo {
  if (singleton) return singleton;

  const mode = process.env.NEXT_PUBLIC_DATA_MODE ?? "seed";

  if (mode === "seed") singleton = new ScopeRepoSeed();
  else if (mode === "local") singleton = new ScopeRepoLocal();
  else throw new Error("Modo de dados não suportado.");

  return singleton;
}