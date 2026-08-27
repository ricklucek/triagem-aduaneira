"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { LoaderCircle, MapPin, Search } from "lucide-react";
import { Field, TextInput } from "@/components/ui/form-fields";
import type { PrepostoLookupItem } from "@/lib/api/types/public-api";
import { publicApi } from "@/lib/api/services/public";

export type SelectedPreposto = {
  id?: string | null;
  nome?: string | null;
  contatoNome?: string | null;
  telefone?: string | null;
  email?: string | null;
  valor?: number | null;
  valorDescricao?: string | null;
  descricaoLocal?: string | null;
  origem: "API" | "MANUAL";
};

type Props = {
  operacao: "IMPORTACAO" | "EXPORTACAO";
  selected?: SelectedPreposto | null;
  error?: string;
  onSelect: (item: PrepostoLookupItem) => void;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function locationLabel(
  item: Pick<PrepostoLookupItem, "cidade" | "uf" | "descricaoLocal">,
) {
  const city = [item.cidade, item.uf].filter(Boolean).join(" / ");
  return item.descricaoLocal ? `${city} — ${item.descricaoLocal}` : city;
}

function selectedLabel(selected?: SelectedPreposto | null) {
  if (!selected) return "";
  return selected.descricaoLocal || selected.nome || "";
}

function formatValue(item: PrepostoLookupItem) {
  if (item.valor !== null && item.valor !== undefined && item.valor !== "") {
    const value = Number(item.valor);
    if (!Number.isNaN(value)) {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: item.moeda || "BRL",
      }).format(value);
    }
  }

  return item.valorDescricao || "Valor não informado";
}

function contactLabel(item: PrepostoLookupItem) {
  return [item.contatoNome, item.telefone, item.email]
    .filter(Boolean)
    .join(" • ");
}

export default function PrepostoLookupPanel({
  operacao,
  selected,
  error,
  onSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PrepostoLookupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadedOperationRef = useRef<string | null>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function loadOptions() {
    if (loading || loadedOperationRef.current === operacao) return;

    setLoading(true);
    setLoadError(null);
    try {
      const response = await publicApi.lookupPrepostos({
        cidade: "",
        operacao,
      });
      setItems(response.items);
      loadedOperationRef.current = operacao;
    } catch {
      setLoadError("Não foi possível carregar os prepostos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function openOptions() {
    setOpen(true);
    setQuery("");
    void loadOptions();
  }

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalize(query.trim());
    if (!normalizedQuery) return items;

    return items.filter((item) =>
      [
        item.cidade,
        item.uf,
        item.descricaoLocal,
        item.nome,
        item.contatoNome,
        item.telefone,
        item.email,
      ]
        .filter(Boolean)
        .some((value) => normalize(String(value)).includes(normalizedQuery)),
    );
  }, [items, query]);

  return (
    <Field
      label={
        operacao === "IMPORTACAO"
          ? "Preposto por local de entrada"
          : "Preposto por local de saída"
      }
      hint="Pesquise por cidade, UF, local, preposto ou contato."
      error={error}
    >
      <div ref={containerRef} className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-3.5 left-3.5 z-10 size-4 text-muted-foreground"
        />
        <TextInput
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          invalid={Boolean(error)}
          className="pl-10"
          value={open ? query : selectedLabel(selected)}
          placeholder="Focalize para pesquisar um local"
          onFocus={openOptions}
          onClick={() => {
            if (!open) openOptions();
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
        />

        {open ? (
          <div
            id={listboxId}
            role="listbox"
            className="absolute z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                Carregando prepostos...
              </div>
            ) : loadError ? (
              <button
                type="button"
                className="w-full rounded-lg px-4 py-4 text-center text-sm text-destructive hover:bg-muted/50"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  loadedOperationRef.current = null;
                  void loadOptions();
                }}
              >
                {loadError} Clique para tentar novamente.
              </button>
            ) : filteredItems.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Nenhum preposto encontrado para esta pesquisa.
              </p>
            ) : (
              filteredItems.map((item) => {
                const isSelected =
                  selected?.id === item.id &&
                  selected?.descricaoLocal === locationLabel(item);
                const contact = contactLabel(item);

                return (
                  <button
                    key={`${item.id}-${item.cidade}-${item.descricaoLocal ?? ""}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none aria-selected:bg-accent"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onSelect(item);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <MapPin
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-primary"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">
                        {locationLabel(item)}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {item.nome}
                        {contact ? ` • ${contact}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold">
                      {formatValue(item)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        ) : null}
      </div>
    </Field>
  );
}

export function prepostoLocationLabel(item: PrepostoLookupItem) {
  return locationLabel(item);
}

export function prepostoNumericValue(item: PrepostoLookupItem) {
  if (item.valor === null || item.valor === undefined || item.valor === "") {
    return null;
  }

  const value = Number(item.valor);
  return Number.isNaN(value) ? null : value;
}

export function selectedPrepostoFromItem(
  item: PrepostoLookupItem,
): SelectedPreposto {
  return {
    id: item.id,
    nome: item.nome,
    contatoNome: item.contatoNome,
    telefone: item.telefone,
    email: item.email,
    valor: prepostoNumericValue(item),
    valorDescricao: item.valorDescricao,
    descricaoLocal: locationLabel(item),
    origem: "API",
  };
}

export function prepostoObservationFromItem(item: PrepostoLookupItem) {
  return [
    `Local: ${locationLabel(item)}`,
    `Preposto: ${item.nome}`,
    item.contatoNome ? `Contato: ${item.contatoNome}` : null,
    item.telefone ? `Telefone: ${item.telefone}` : null,
    item.email ? `E-mail: ${item.email}` : null,
    item.valorDescricao ? `Referência do valor: ${item.valorDescricao}` : null,
    item.observacoes ? `Observações cadastradas: ${item.observacoes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
