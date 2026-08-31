"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { BadgeCheck, LoaderCircle, MapPin, Search, Users } from "lucide-react";
import { Field, Select, TextInput } from "@/components/ui/form-fields";
import type { PrepostoLookupItem } from "@/lib/api/types/public-api";
import { publicApi } from "@/lib/api/services/public";

type SelectedTariff = {
  id: string;
  codigo?: string | null;
  tipo: string;
  operacao: "IMPORTACAO" | "EXPORTACAO" | "AMBAS";
  valor?: number | null;
  valorDescricao?: string | null;
  condicao: string;
  principal: boolean;
  moeda: string;
  observacoes?: string | null;
};

type SelectedCredential = {
  id: string;
  nome: string;
  cpfMascarado?: string | null;
  registroRfb?: string | null;
  categoria?: string | null;
};

export type SelectedPreposto = {
  id?: string | null;
  localidadeId?: string | null;
  nome?: string | null;
  cidade?: string | null;
  uf?: string | null;
  contatoNome?: string | null;
  telefone?: string | null;
  email?: string | null;
  valor?: number | null;
  valorDescricao?: string | null;
  moeda?: string | null;
  descricaoLocal?: string | null;
  tarifaSelecionada?: SelectedTariff | null;
  tarifasDisponiveis?: SelectedTariff[];
  credenciados?: SelectedCredential[];
  origem: "API" | "MANUAL";
};

type Props = {
  operacao: "IMPORTACAO" | "EXPORTACAO";
  selected?: SelectedPreposto | null;
  error?: string;
  tariffError?: string;
  onChange: (selected: SelectedPreposto) => void;
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

function formatMoney(value: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value);
}

function formatTariff(tariff: SelectedTariff) {
  if (tariff.valor !== null && tariff.valor !== undefined) {
    return formatMoney(Number(tariff.valor), tariff.moeda || "BRL");
  }

  return tariff.valorDescricao || "Valor a definir";
}

function defaultTariff(item: PrepostoLookupItem) {
  const tariffs = item.tarifas ?? [];
  return (
    tariffs.find((tariff) => tariff.principal) ??
    (tariffs.length === 1 ? tariffs[0] : null)
  );
}

function formatLookupValue(item: PrepostoLookupItem) {
  const tariff = defaultTariff(item);
  if (tariff) return formatTariff(tariff);
  if ((item.tarifas?.length ?? 0) > 1) return `${item.tarifas?.length} tarifas`;

  if (item.valor !== null && item.valor !== undefined && item.valor !== "") {
    const value = Number(item.valor);
    if (!Number.isNaN(value)) return formatMoney(value, item.moeda || "BRL");
  }

  return item.valorDescricao || "Valor não informado";
}

function contactLabel(item: PrepostoLookupItem) {
  return [item.contatoNome, item.telefone, item.email]
    .filter(Boolean)
    .join(" • ");
}

function credentialDetails(credential: SelectedCredential) {
  return [
    credential.categoria,
    credential.registroRfb ? `Registro RFB: ${credential.registroRfb}` : null,
    credential.cpfMascarado ? `CPF: ${credential.cpfMascarado}` : null,
  ]
    .filter(Boolean)
    .join(" • ");
}

export default function PrepostoLookupPanel({
  operacao,
  selected,
  error,
  tariffError,
  onChange,
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
      const response = await publicApi.lookupPrepostos({ operacao });
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
        ...(item.tarifas ?? []).map((tariff) => tariff.condicao),
        ...(item.credenciados ?? []).map((credential) => credential.nome),
      ]
        .filter(Boolean)
        .some((value) => normalize(String(value)).includes(normalizedQuery)),
    );
  }, [items, query]);

  const tariffs = selected?.tarifasDisponiveis ?? [];
  const credentials = selected?.credenciados ?? [];

  return (
    <div className="grid gap-4">
      <Field
        label={
          operacao === "IMPORTACAO"
            ? "Preposto por local de entrada"
            : "Preposto por local de saída"
        }
        hint="Pesquise por cidade, UF, local, preposto, tarifa ou credenciado."
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
                    selected?.localidadeId === item.localidadeId;
                  const contact = contactLabel(item);

                  return (
                    <button
                      key={`${item.id}-${item.localidadeId}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none aria-selected:bg-accent"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onChange(selectedPrepostoFromItem(item));
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
                        {formatLookupValue(item)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          ) : null}
        </div>
      </Field>

      {selected && tariffs.length > 0 ? (
        <Field
          label="Tarifa aplicada"
          required
          hint="Selecione a condição tarifária que será aplicada neste escopo."
          error={tariffError}
        >
          <Select
            value={selected.tarifaSelecionada?.id ?? ""}
            invalid={Boolean(tariffError)}
            onChange={(event) => {
              const tariff = tariffs.find(
                (item) => item.id === event.target.value,
              );
              if (!tariff) return;
              onChange(selectedPrepostoWithTariff(selected, tariff));
            }}
          >
            <option value="">Selecione uma tarifa</option>
            {tariffs.map((tariff) => (
              <option key={tariff.id} value={tariff.id}>
                {tariff.condicao} — {formatTariff(tariff)}
                {tariff.principal ? " (principal)" : " (condicional)"}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      {selected?.tarifaSelecionada ? (
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 text-sm">
          <div className="flex items-center gap-2 font-semibold">
            <BadgeCheck className="size-4 text-primary" />
            {selected.tarifaSelecionada.condicao}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {selected.tarifaSelecionada.principal
              ? "Tarifa principal"
              : "Tarifa condicional"}
            {selected.tarifaSelecionada.observacoes
              ? ` • ${selected.tarifaSelecionada.observacoes}`
              : ""}
          </p>
        </div>
      ) : null}

      {selected && credentials.length > 0 ? (
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <p className="text-sm font-semibold">
              Despachantes credenciados ({credentials.length})
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {credentials.map((credential) => (
              <div
                key={credential.id}
                className="rounded-lg border border-border bg-background px-3 py-2.5"
              >
                <p className="text-sm font-medium">{credential.nome}</p>
                {credentialDetails(credential) ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {credentialDetails(credential)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function prepostoLocationLabel(item: PrepostoLookupItem) {
  return locationLabel(item);
}

export function selectedPrepostoFromItem(
  item: PrepostoLookupItem,
): SelectedPreposto {
  const tariff = defaultTariff(item);
  const fallbackValue =
    item.valor === null || item.valor === undefined || item.valor === ""
      ? null
      : Number(item.valor);

  return {
    id: item.id,
    localidadeId: item.localidadeId,
    nome: item.nome,
    cidade: item.cidade,
    uf: item.uf,
    contatoNome: item.contatoNome,
    telefone: item.telefone,
    email: item.email,
    valor:
      tariff?.valor ??
      (fallbackValue !== null && !Number.isNaN(fallbackValue)
        ? fallbackValue
        : null),
    valorDescricao: tariff?.valorDescricao ?? item.valorDescricao,
    moeda: tariff?.moeda ?? item.moeda ?? "BRL",
    descricaoLocal: locationLabel(item),
    tarifaSelecionada: tariff,
    tarifasDisponiveis: (item.tarifas ?? []).map((entry) => ({ ...entry })),
    credenciados: (item.credenciados ?? []).map((credential) => ({
      ...credential,
    })),
    origem: "API",
  };
}

export function selectedPrepostoWithTariff(
  selected: SelectedPreposto,
  tariff: SelectedTariff,
): SelectedPreposto {
  return {
    ...selected,
    valor: tariff.valor,
    valorDescricao: tariff.valorDescricao,
    moeda: tariff.moeda || selected.moeda || "BRL",
    tarifaSelecionada: { ...tariff },
  };
}

export function prepostoObservationFromSelection(item: SelectedPreposto) {
  const tariff = item.tarifaSelecionada;
  const credentials = item.credenciados ?? [];

  return [
    item.descricaoLocal ? `Local: ${item.descricaoLocal}` : null,
    item.nome ? `Preposto: ${item.nome}` : null,
    item.contatoNome ? `Contato: ${item.contatoNome}` : null,
    item.telefone ? `Telefone: ${item.telefone}` : null,
    item.email ? `E-mail: ${item.email}` : null,
    tariff ? `Tarifa aplicada: ${tariff.condicao}` : null,
    tariff?.valorDescricao
      ? `Referência do valor: ${tariff.valorDescricao}`
      : item.valorDescricao
        ? `Referência do valor: ${item.valorDescricao}`
        : null,
    tariff?.observacoes ? `Observações da tarifa: ${tariff.observacoes}` : null,
    credentials.length
      ? `Despachantes credenciados: ${credentials
          .map((credential) => credential.nome)
          .join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}
