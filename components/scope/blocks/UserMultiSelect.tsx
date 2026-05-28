"use client";

import type { ScopeResponsible } from "@/lib/api/types/scope-metadata";

import { Badge } from "@/components/ui/badge";
import { Field, Select } from "@/components/ui/form-fields";

import {
  responsibleDepartment,
  responsibleName,
} from "../canonical-draft";


export default function UserMultiSelect({ label, value, onChange, options, error }: { label: string; value: string[]; onChange: (value: string[]) => void; options: ScopeResponsible[]; error?: string }) {
  const selected = new Set(value ?? []);
  return (
    <div className="space-y-2">
      <Field label={label} error={error}>
        <Select
          value=""
          onChange={(e) => {
            if (!e.target.value) return;
            onChange(Array.from(new Set([...(value ?? []), e.target.value])));
          }}
        >
          <option value="">Adicionar responsável</option>
          {options.map((user: any) => (
            <option key={user.id} value={user.id} disabled={selected.has(user.id)}>
              {responsibleName(user)}{responsibleDepartment(user) ? ` • ${responsibleDepartment(user)}` : ""}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex flex-wrap gap-2">
        {(value ?? []).map((id) => {
          const user = options.find((item: any) => item.id === id) as any;
          return (
            <Badge key={id} variant="secondary" className="gap-2">
              {responsibleName(user) || id}
              <button type="button" onClick={() => onChange(value.filter((item) => item !== id))}>×</button>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}