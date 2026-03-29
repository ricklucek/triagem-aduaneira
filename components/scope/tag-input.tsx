"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  placeholder?: string;
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
};

export function TagInput({
  label,
  placeholder,
  value,
  onChange,
  className,
}: Props) {
  const [draft, setDraft] = useState("");

  const normalized = useMemo(
    () => value.map((v) => v.trim()).filter(Boolean),
    [value],
  );

  function addFromText(text: string) {
    const parts = text
      .split(/[,\n;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (!parts.length) return;

    const next = Array.from(new Set([...normalized, ...parts]));
    onChange(next);
    setDraft("");
  }

  function removeTag(tag: string) {
    onChange(normalized.filter((t) => t !== tag));
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-xs text-muted-foreground">{label}</div>

      <div className="flex gap-2">
        <Input
          className="rounded-xl"
          value={draft}
          placeholder={placeholder ?? "Digite e pressione Enter"}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addFromText(draft);
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => addFromText(draft)}
        >
          Adicionar
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {normalized.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            Nenhum item ainda.
          </div>
        ) : (
          normalized.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-2 rounded-xl py-1"
            >
              {tag}
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => removeTag(tag)}
                aria-label={`Remover ${tag}`}
              >
                ×
              </button>
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}
