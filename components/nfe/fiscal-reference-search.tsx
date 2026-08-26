"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nfeApi } from "@/lib/api/services/nfe";
import type {
  FiscalCountryReference,
  FiscalMunicipalityReference,
} from "@/lib/api/types/nfe-api";
import { cn } from "@/lib/utils";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function ResultList({
  children,
  empty,
  open,
}: {
  children: React.ReactNode;
  empty: boolean;
  open: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
      role="listbox"
    >
      {empty ? (
        <p className="px-3 py-2 text-sm text-muted-foreground">
          Nenhum registro fiscal encontrado.
        </p>
      ) : children}
    </div>
  );
}

export function MunicipalityReferenceSearch({
  initialCode = "",
  initialName = "",
  initialState = "",
  codeName = "city_code",
  cityName = "city_name",
  stateName = "state",
  disabled = false,
  className,
}: {
  initialCode?: string;
  initialName?: string;
  initialState?: string;
  codeName?: string;
  cityName?: string;
  stateName?: string;
  disabled?: boolean;
  className?: string;
}) {
  const initialLabel = initialName
    ? `${initialName} — ${initialState}`
    : "";
  const [query, setQuery] = useState(initialLabel);
  const [selected, setSelected] = useState<FiscalMunicipalityReference | null>(
    initialCode
      ? {
          code: initialCode,
          name: initialName,
          state: initialState,
          active: true,
          updated_at: "",
        }
      : null,
  );
  const [items, setItems] = useState<FiscalMunicipalityReference[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const label = initialName ? `${initialName} — ${initialState}` : "";
    setQuery(label);
    setSelected(
      initialCode
        ? {
            code: initialCode,
            name: initialName,
            state: initialState,
            active: true,
            updated_at: "",
          }
        : null,
    );
  }, [initialCode, initialName, initialState]);

  useEffect(() => {
    const normalized = query.trim();
    if (!open || normalized.length < 2 || selected) {
      setItems([]);
      setLoading(false);
      return;
    }

    const currentRequest = ++requestId.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await nfeApi.searchMunicipalities({
          q: normalized,
          limit: 20,
        });
        if (requestId.current === currentRequest) setItems(response.items);
      } catch {
        if (requestId.current === currentRequest) setItems([]);
      } finally {
        if (requestId.current === currentRequest) setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [open, query, selected]);

  function choose(item: FiscalMunicipalityReference) {
    setSelected(item);
    setQuery(`${item.name} — ${item.state}`);
    setItems([]);
    setOpen(false);
  }

  return (
    <div className={cn("space-y-3 sm:col-span-2", className)}>
      <div className="space-y-1.5">
        <Label htmlFor={`${codeName}-reference-search`}>
          Pesquisar município
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input
            id={`${codeName}-reference-search`}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(null);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
            className="pl-9"
            placeholder="Digite o município ou código IBGE"
            autoComplete="off"
            aria-autocomplete="list"
            disabled={disabled}
            required
          />
          {loading && (
            <Loader2 className="absolute top-2.5 right-3 size-4 animate-spin text-muted-foreground" />
          )}
          <ResultList
            open={open && query.trim().length >= 2 && !selected}
            empty={!loading && items.length === 0}
          >
            {items.map((item) => (
              <button
                key={item.code}
                type="button"
                role="option"
                className="flex w-full items-center justify-between gap-3 rounded-sm px-3 py-2 text-left text-sm hover:bg-accent"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(item)}
              >
                <span>{item.name} — {item.state}</span>
                <span className="text-xs text-muted-foreground">{item.code}</span>
              </button>
            ))}
          </ResultList>
        </div>
      </div>

      <input type="hidden" name={codeName} value={selected?.code || ""} />
      <input type="hidden" name={cityName} value={selected?.name || ""} />
      <input type="hidden" name={stateName} value={selected?.state || ""} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Código IBGE</Label>
          <Input value={selected?.code || ""} readOnly placeholder="Preenchido pela seleção" />
        </div>
        <div className="space-y-1.5">
          <Label>UF</Label>
          <Input value={selected?.state || ""} readOnly placeholder="Preenchida pela seleção" />
        </div>
      </div>
    </div>
  );
}

export function CountryReferenceSearch({
  initialBacenCode = "",
  initialName = "",
  initialIsoAlpha2 = "",
  bacenCodeName = "country_code",
  countryName = "country_name",
  isoAlpha2Name = "country_iso_alpha_2",
  activeOn,
  disabled = false,
  className,
}: {
  initialBacenCode?: string;
  initialName?: string;
  initialIsoAlpha2?: string;
  bacenCodeName?: string;
  countryName?: string;
  isoAlpha2Name?: string;
  activeOn?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [query, setQuery] = useState(initialName);
  const [selected, setSelected] = useState<FiscalCountryReference | null>(
    initialBacenCode
      ? {
          bacen_code: initialBacenCode,
          name: initialName,
          iso_alpha_2: initialIsoAlpha2 || null,
          iso_alpha_3: null,
          valid_from: null,
          valid_until: null,
          active: true,
          updated_at: "",
        }
      : null,
  );
  const [items, setItems] = useState<FiscalCountryReference[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    setQuery(initialName);
    setSelected(
      initialBacenCode
        ? {
            bacen_code: initialBacenCode,
            name: initialName,
            iso_alpha_2: initialIsoAlpha2 || null,
            iso_alpha_3: null,
            valid_from: null,
            valid_until: null,
            active: true,
            updated_at: "",
          }
        : null,
    );
  }, [initialBacenCode, initialIsoAlpha2, initialName]);

  useEffect(() => {
    const normalized = query.trim();
    if (!open || normalized.length < 2 || selected) {
      setItems([]);
      setLoading(false);
      return;
    }

    const currentRequest = ++requestId.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await nfeApi.searchCountries({
          q: normalized,
          active_on: (activeOn || today()).slice(0, 10),
          limit: 20,
        });
        if (requestId.current === currentRequest) setItems(response.items);
      } catch {
        if (requestId.current === currentRequest) setItems([]);
      } finally {
        if (requestId.current === currentRequest) setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [activeOn, open, query, selected]);

  function choose(item: FiscalCountryReference) {
    setSelected(item);
    setQuery(item.name);
    setItems([]);
    setOpen(false);
  }

  return (
    <div className={cn("space-y-3 sm:col-span-2", className)}>
      <div className="space-y-1.5">
        <Label htmlFor={`${bacenCodeName}-reference-search`}>
          Pesquisar país
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input
            id={`${bacenCodeName}-reference-search`}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(null);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
            className="pl-9"
            placeholder="Digite o país, código BACEN ou ISO"
            autoComplete="off"
            aria-autocomplete="list"
            disabled={disabled}
            required
          />
          {loading && (
            <Loader2 className="absolute top-2.5 right-3 size-4 animate-spin text-muted-foreground" />
          )}
          <ResultList
            open={open && query.trim().length >= 2 && !selected}
            empty={!loading && items.length === 0}
          >
            {items.map((item) => (
              <button
                key={item.bacen_code}
                type="button"
                role="option"
                className="flex w-full items-center justify-between gap-3 rounded-sm px-3 py-2 text-left text-sm hover:bg-accent"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(item)}
              >
                <span>{item.name}</span>
                <span className="text-xs text-muted-foreground">
                  BACEN {item.bacen_code}{item.iso_alpha_2 ? ` · ${item.iso_alpha_2}` : ""}
                </span>
              </button>
            ))}
          </ResultList>
        </div>
      </div>

      <input type="hidden" name={bacenCodeName} value={selected?.bacen_code || ""} />
      <input type="hidden" name={countryName} value={selected?.name || ""} />
      <input type="hidden" name={isoAlpha2Name} value={selected?.iso_alpha_2 || ""} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Código BACEN</Label>
          <Input value={selected?.bacen_code || ""} readOnly placeholder="Preenchido pela seleção" />
        </div>
        <div className="space-y-1.5">
          <Label>ISO alpha-2</Label>
          <Input value={selected?.iso_alpha_2 || ""} readOnly placeholder="Preenchido pela seleção" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Vigência consultada em {(activeOn || today()).slice(0, 10)}.
      </p>
    </div>
  );
}
