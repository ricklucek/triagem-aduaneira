"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nfeApi } from "@/lib/api/services/nfe";
import type { NfeCarrier } from "@/lib/api/types/nfe-api";

function text(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function formatTaxId(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 14) {
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  }
  if (digits.length === 11) {
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }
  return value;
}

export function NfeCarrierSelector({
  initialCarrier,
}: {
  initialCarrier?: Record<string, unknown>;
}) {
  const sourceCarrierId = text(initialCarrier?.source_carrier_id);
  const [mode, setMode] = useState<"registered" | "manual">(
    sourceCarrierId ? "registered" : "manual",
  );
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<NfeCarrier[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<NfeCarrier | null>(
    sourceCarrierId
      ? {
          id: sourceCarrierId,
          organization_id: "",
          legal_name: text(initialCarrier?.name),
          trade_name: text(initialCarrier?.trade_name) || null,
          tax_id: text(initialCarrier?.tax_id),
          state_registration: text(initialCarrier?.state_registration) || null,
          street: text(initialCarrier?.street),
          number: text(initialCarrier?.number),
          complement: text(initialCarrier?.complement) || null,
          district: text(initialCarrier?.district),
          municipality_code: text(initialCarrier?.municipality_code),
          municipality_name: text(initialCarrier?.city_name),
          state: text(initialCarrier?.state),
          zip_code: text(initialCarrier?.zip_code),
          phone: text(initialCarrier?.phone) || null,
          email: text(initialCarrier?.email) || null,
          active: true,
          created_at: "",
          updated_at: "",
        }
      : null,
  );
  const requestId = useRef(0);

  useEffect(() => {
    if (mode !== "registered" || selected) return;
    const currentRequest = ++requestId.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await nfeApi.listCarriers({
          q: query.trim() || undefined,
          active: true,
          limit: 20,
        });
        if (requestId.current === currentRequest) setItems(response.items);
      } catch {
        if (requestId.current === currentRequest) setItems([]);
      } finally {
        if (requestId.current === currentRequest) setLoading(false);
      }
    }, query.trim() ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [mode, query, selected]);

  return (
    <div className="space-y-4 sm:col-span-2">
      <input type="hidden" name="carrier_mode" value={mode} />
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          className={`rounded-lg border p-3 text-left text-sm ${mode === "registered" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
          onClick={() => setMode("registered")}
        >
          <strong className="block">Utilizar cadastro</strong>
          <span className="text-xs text-muted-foreground">Copia os dados atuais para este rascunho.</span>
        </button>
        <button
          type="button"
          className={`rounded-lg border p-3 text-left text-sm ${mode === "manual" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
          onClick={() => setMode("manual")}
        >
          <strong className="block">Preencher manualmente</strong>
          <span className="text-xs text-muted-foreground">Usa dados exclusivos nesta NF-e.</span>
        </button>
      </div>

      {mode === "registered" ? (
        <div className="space-y-3">
          <input type="hidden" name="registered_carrier_id" value={selected?.id || ""} />
          {selected ? (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div>
                <p className="flex items-center gap-2 font-medium"><Check className="size-4 text-primary" /> {selected.legal_name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatTaxId(selected.tax_id)} · {selected.municipality_name}/{selected.state}
                </p>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setSelected(null); setQuery(""); }}>
                <X /> Trocar
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="registered_carrier_search">Pesquisar transportadora cadastrada</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
                <Input
                  id="registered_carrier_search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pl-9"
                  placeholder="Razão social, nome fantasia, CNPJ ou CPF"
                  autoComplete="off"
                />
                {loading && <Loader2 className="absolute top-2.5 right-3 size-4 animate-spin text-muted-foreground" />}
              </div>
              <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border p-1">
                {!loading && items.length === 0 && (
                  <p className="p-3 text-sm text-muted-foreground">Nenhuma transportadora ativa encontrada.</p>
                )}
                {items.map((carrier) => (
                  <button
                    key={carrier.id}
                    type="button"
                    className="w-full rounded-md px-3 py-2 text-left hover:bg-muted"
                    onClick={() => setSelected(carrier)}
                  >
                    <strong className="block text-sm">{carrier.legal_name}</strong>
                    <span className="text-xs text-muted-foreground">{formatTaxId(carrier.tax_id)} · {carrier.municipality_name}/{carrier.state}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Cadastre novas transportadoras em Emissão de NF-e → Cadastros → Transportadoras.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="carrier_name">Transportadora</Label><Input id="carrier_name" name="carrier_name" defaultValue={text(initialCarrier?.name)} /></div>
          <div className="space-y-1.5"><Label htmlFor="carrier_tax_id">CNPJ/CPF da transportadora</Label><Input id="carrier_tax_id" name="carrier_tax_id" defaultValue={text(initialCarrier?.tax_id)} /></div>
          <div className="space-y-1.5"><Label htmlFor="carrier_state_registration">Inscrição estadual</Label><Input id="carrier_state_registration" name="carrier_state_registration" defaultValue={text(initialCarrier?.state_registration)} /></div>
          <div className="space-y-1.5"><Label htmlFor="carrier_address">Endereço da transportadora</Label><Input id="carrier_address" name="carrier_address" defaultValue={text(initialCarrier?.address)} /></div>
          <div className="space-y-1.5"><Label htmlFor="carrier_city_name">Município</Label><Input id="carrier_city_name" name="carrier_city_name" defaultValue={text(initialCarrier?.city_name)} /></div>
          <div className="space-y-1.5"><Label htmlFor="carrier_state">UF</Label><Input id="carrier_state" name="carrier_state" defaultValue={text(initialCarrier?.state)} maxLength={2} /></div>
        </div>
      )}
    </div>
  );
}
