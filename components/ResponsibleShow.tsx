"use client";

import type { ScopeResponsible } from "@/lib/api/types/scope-metadata";
import { cn } from "@/lib/utils";

interface ResponsibleShowProps {
  value?: string | null;
  options: ScopeResponsible[];
}

export function ResponsibleShow({
  value,
  options,
}: ResponsibleShowProps) {

  const selected = options.find((item) => item.id === value);

  return (
    <div className="space-y-2">
      <span className={cn(!selected && "text-muted-foreground")}>
        {selected
          ? `${selected.nome} • ${selected.setor}`
          : "Selecione um responsável"}
      </span>
    </div>
  );
}
