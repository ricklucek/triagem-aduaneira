"use client";

import { useMemo, useState } from "react";
import { Checkbox, Field, TextInput } from "@/components/ui/form-fields";
import { Card, Stack } from "@/components/ui/form-layout";

type Option = { value: string; label: string };

type Props = {
  title: string;
  searchLabel: string;
  value: string[];
  options: readonly Option[];
  onChange: (next: string[]) => void;
  customValue?: string;
  onCustomValueChange?: (next: string) => void;
  customLabel?: string;
  error?: string;
};

export default function SearchableCheckboxMenu({
  title,
  searchLabel,
  value,
  options,
  onChange,
  customValue = "",
  onCustomValueChange,
  customLabel,
  error,
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(normalized),
    );
  }, [options, query]);

  const showCustomOption =
    Boolean(query.trim()) &&
    !options.some(
      (option) => option.label.toLowerCase() === query.trim().toLowerCase(),
    );
  const customOptionValue = query.trim();
  const mergedValue = value.filter(Boolean);

  function toggle(optionValue: string, checked: boolean) {
    const next = new Set(mergedValue);
    if (checked) next.add(optionValue);
    else next.delete(optionValue);
    onChange(Array.from(next));
  }

  return (
    <Card className="gap-4 rounded-2xl border-border/80 p-4 shadow-none sm:p-5">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">
          Pesquise e selecione uma ou mais opções.
        </p>
      </div>

      <Field label={searchLabel} error={error}>
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Digite para pesquisar"
        />
      </Field>

      <details className="rounded-xl border border-border bg-background px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium">
          {mergedValue.length > 0
            ? `${mergedValue.length} opção(ões) selecionada(s)`
            : "Abrir lista de opções"}
        </summary>

        <Stack gap={10}>
          <div className="mt-4 grid gap-2">
            {filtered.map((option) => (
              <Checkbox
                key={option.value}
                label={option.label}
                checked={mergedValue.includes(option.value)}
                onChange={(checked) => toggle(option.value, checked)}
              />
            ))}

            {showCustomOption ? (
              <Checkbox
                label={`Outras opções: ${customOptionValue}`}
                checked={mergedValue.includes(customOptionValue)}
                onChange={(checked) => toggle(customOptionValue, checked)}
              />
            ) : null}
          </div>
        </Stack>
      </details>

      {onCustomValueChange ? (
        <Field label={customLabel ?? "Outra opção"} hint="Campo opcional">
          <TextInput
            value={customValue}
            onChange={(e) => onCustomValueChange(e.target.value)}
          />
        </Field>
      ) : null}
    </Card>
  );
}
