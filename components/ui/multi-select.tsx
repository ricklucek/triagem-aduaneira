"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Option = { id: string; label: string; code?: string };

export function MultiSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  options: readonly Option[];
  placeholder?: string;
  className?: string;
}) {
  function toggle(id: string) {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else onChange([...value, id]);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2">
        {value.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            {placeholder ?? "Selecione..."}
          </div>
        ) : (
          value.map((id) => {
            const opt = options.find((o) => o.id === id);
            return (
              <Badge key={id} variant="secondary" className="rounded-xl">
                {opt?.label ?? id}
              </Badge>
            );
          })
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value.includes(o.id);
          return (
            <Button
              key={o.id}
              type="button"
              variant={active ? "default" : "outline"}
              className={cn("rounded-xl", active && "shadow-sm")}
              onClick={() => toggle(o.id)}
            >
              {o.label}
              {o.code ? (
                <span className="ml-2 text-xs opacity-70">{o.code}</span>
              ) : null}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
