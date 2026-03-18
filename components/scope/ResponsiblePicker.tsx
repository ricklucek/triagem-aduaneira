"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ScopeResponsible } from "@/lib/api/types/scope-metadata";
import { cn } from "@/lib/utils";

interface ResponsiblePickerProps {
  label: string;
  value?: string | null;
  onChange: (value: string) => void;
  options: ScopeResponsible[];
  error?: string;
  filterRoles?: string[];
  filterSetores?: string[];
}

export function ResponsiblePicker({
  label,
  value,
  onChange,
  options,
  error,
  filterRoles,
  filterSetores,
}: ResponsiblePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return options.filter((item) => {
      const byRole = !filterRoles?.length || filterRoles.includes(item.role);
      const bySetor = !filterSetores?.length || filterSetores.includes(item.setor);
      const byQuery = !query || `${item.nome} ${item.email} ${item.setor}`.toLowerCase().includes(query.toLowerCase());
      return byRole && bySetor && byQuery;
    });
  }, [filterRoles, filterSetores, options, query]);

  const selected = options.find((item) => item.id === value);

  return (
    <div className="space-y-2">
      <span className={cn("text-sm font-medium text-foreground", error && "text-destructive")}>{label}</span>
      <div className={cn("rounded-xl border bg-background", error && "border-destructive bg-destructive/5") }>
        <button
          type="button"
          className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className={cn(!selected && "text-muted-foreground")}>{selected ? `${selected.nome} • ${selected.setor}` : "Selecione um responsável"}</span>
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </button>
        {open ? (
          <div className="space-y-2 border-t p-3">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar responsável" />
            <div className="max-h-60 space-y-2 overflow-auto">
              {filtered.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant={item.id === value ? "default" : "outline"}
                  className="h-auto w-full justify-start whitespace-normal py-2 text-left"
                  onClick={() => {
                    onChange(item.id);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <div>
                    <div className="font-medium">{item.nome}</div>
                    <div className="text-xs opacity-80">{item.email} • {item.role} • {item.setor}</div>
                  </div>
                </Button>
              ))}
              {filtered.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum responsável encontrado.</p> : null}
            </div>
          </div>
        ) : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
