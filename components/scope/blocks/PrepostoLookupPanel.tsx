"use client";

import { useMemo, useState } from "react";
import { Field, NumberInput, TextInput } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { Card, Grid, Stack } from "@/components/ui/form-layout";
import type { PrepostoLookupItem } from "@/lib/api/types/public-api";

type SelectedPreposto = {
  id?: string | null;
  nome: string;
  contatoNome?: string | null;
  telefone?: string | null;
  email?: string | null;
  valor: number;
  valorDescricao?: string | null;
  descricaoLocal?: string | null;
  origem: "API" | "MANUAL";
};

type Props = {
  title: string;
  cidade: string;
  loading: boolean;
  results: PrepostoLookupItem[];
  selected?: SelectedPreposto | null;
  onSearch: () => void;
  onChange: (next: SelectedPreposto) => void;
  errors?: Record<string, string | undefined>;
};

function parseCurrencyString(value?: string | null) {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function PrepostoLookupPanel({ title, cidade, loading, results, selected, onSearch, onChange, errors }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return results;
    return results.filter((item) => [item.nome, item.contatoNome, item.cidade, item.telefone, item.email].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalized)));
  }, [results, query]);

  return (
    <Card className="gap-4 rounded-2xl border-border/80 p-4 shadow-none sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">Consulte os prepostos disponíveis para a localidade selecionada ou preencha manualmente.</p>
        </div>
        <Button type="button" variant="outline" onClick={onSearch} disabled={loading || !cidade.trim()}>
          {loading ? "Consultando..." : "Consultar prepostos"}
        </Button>
      </div>

      <Field label="Filtrar resultados" hint={!cidade.trim() ? "Informe a cidade/porto/fronteira para habilitar a consulta." : undefined}>
        <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar por nome, contato ou localidade" />
      </Field>

      <details className="rounded-xl border border-border bg-background px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium">Abrir opções encontradas</summary>
        <Stack gap={10}>
          <div className="mt-4 grid gap-3">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum preposto encontrado para a consulta atual.</p>
            ) : (
              filtered.map((item) => (
                <button
                  key={`${item.id}-${item.cidade}-${item.descricaoLocal}`}
                  type="button"
                  className="rounded-xl border border-border p-3 text-left hover:bg-muted/40"
                  onClick={() => onChange({
                    id: item.id,
                    nome: item.nome,
                    contatoNome: item.contatoNome,
                    telefone: item.telefone,
                    email: item.email,
                    valor: parseCurrencyString(item.valor),
                    valorDescricao: item.valorDescricao,
                    descricaoLocal: item.descricaoLocal,
                    origem: "API",
                  })}
                >
                  <div className="font-medium">{item.nome}</div>
                  <div className="text-sm text-muted-foreground">Contato: {item.contatoNome ?? "-"}</div>
                  <div className="text-sm text-muted-foreground">Telefone: {item.telefone ?? "-"}</div>
                  <div className="text-sm text-muted-foreground">Valor: {item.valor ? `${item.moeda ?? "BRL"} ${item.valor}` : item.valorDescricao ?? "-"}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{item.descricaoLocal ?? item.observacoes ?? `${item.cidade}${item.uf ? `/${item.uf}` : ""}`}</div>
                </button>
              ))
            )}
          </div>
        </Stack>
      </details>

      <Grid columns={2}>
        <Field label="Nome" required error={errors?.nome}>
          <TextInput value={selected?.nome ?? ""} onChange={(e) => onChange({ id: selected?.id, nome: e.target.value, contatoNome: selected?.contatoNome, telefone: selected?.telefone, email: selected?.email, valor: selected?.valor ?? 0, valorDescricao: selected?.valorDescricao, descricaoLocal: selected?.descricaoLocal, origem: "MANUAL" })} />
        </Field>
        <Field label="Contato" hint="Campo opcional">
          <TextInput value={selected?.contatoNome ?? ""} onChange={(e) => onChange({ id: selected?.id, nome: selected?.nome ?? "", contatoNome: e.target.value, telefone: selected?.telefone, email: selected?.email, valor: selected?.valor ?? 0, valorDescricao: selected?.valorDescricao, descricaoLocal: selected?.descricaoLocal, origem: "MANUAL" })} />
        </Field>
        <Field label="Telefone" hint="Campo opcional" error={errors?.telefone}>
          <TextInput value={selected?.telefone ?? ""} onChange={(e) => onChange({ id: selected?.id, nome: selected?.nome ?? "", contatoNome: selected?.contatoNome, telefone: e.target.value, email: selected?.email, valor: selected?.valor ?? 0, valorDescricao: selected?.valorDescricao, descricaoLocal: selected?.descricaoLocal, origem: "MANUAL" })} />
        </Field>
        <Field label="Email" hint="Campo opcional">
          <TextInput value={selected?.email ?? ""} onChange={(e) => onChange({ id: selected?.id, nome: selected?.nome ?? "", contatoNome: selected?.contatoNome, telefone: selected?.telefone, email: e.target.value, valor: selected?.valor ?? 0, valorDescricao: selected?.valorDescricao, descricaoLocal: selected?.descricaoLocal, origem: "MANUAL" })} />
        </Field>
        <Field label="Valor do preposto" required error={errors?.valor}>
          <NumberInput value={selected?.valor ?? ""} onChange={(e) => onChange({ id: selected?.id, nome: selected?.nome ?? "", contatoNome: selected?.contatoNome, telefone: selected?.telefone, email: selected?.email, valor: Number(e.target.value), valorDescricao: selected?.valorDescricao, descricaoLocal: selected?.descricaoLocal, origem: "MANUAL" })} />
        </Field>
      </Grid>
    </Card>
  );
}
