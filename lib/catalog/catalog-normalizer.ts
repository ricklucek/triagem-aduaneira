import { normalizeText, splitList } from "@/lib/normalize";

export type CatalogOption = { id: string; label: string; code?: string };

function scoreMatch(candidate: CatalogOption, token: string): number {
  const t = normalizeText(token);
  const id = normalizeText(candidate.id);
  const label = normalizeText(candidate.label);
  const code = candidate.code ? normalizeText(candidate.code) : "";

  if (!t) return 0;
  if (t === id) return 100;
  if (t === code) return 95;
  if (t === label) return 90;

  // contains heuristics
  if (label.includes(t)) return 70;
  if (t.includes(label)) return 65;

  // code partial
  if (code && (code.includes(t) || t.includes(code))) return 60;

  return 0;
}

export function resolveCatalogId(token: string, catalog: readonly CatalogOption[], minScore = 60): string | null {
  let best: { id: string; score: number } | null = null;

  for (const opt of catalog) {
    const s = scoreMatch(opt, token);
    if (!best || s > best.score) best = { id: opt.id, score: s };
  }

  if (!best || best.score < minScore) return null;
  return best.id;
}

export function resolveCatalogIdsList(
  input: string,
  catalog: readonly CatalogOption[],
  minScore = 60
): { ids: string[]; unmatched: string[] } {
  const tokens = splitList(input);

  const ids: string[] = [];
  const unmatched: string[] = [];

  for (const tok of tokens) {
    const id = resolveCatalogId(tok, catalog, minScore);
    if (id) ids.push(id);
    else unmatched.push(tok);
  }

  // dedupe
  return { ids: Array.from(new Set(ids)), unmatched };
}