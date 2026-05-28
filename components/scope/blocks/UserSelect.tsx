"use client";

import type { ScopeResponsible } from "@/lib/api/types/scope-metadata";

import { Field, Select } from "@/components/ui/form-fields";

import {
  responsibleDepartment,
  responsibleName,
} from "../canonical-draft";


export default function UserSelect({ label, value, onChange, options, error }: { label: string; value: string; onChange: (value: string) => void; options: ScopeResponsible[]; error?: string }) {
  return (
    <Field label={label} required error={error}>
      <Select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">Selecione</option>
        {options.map((user: any) => (
          <option key={user.id} value={user.id}>
            {responsibleName(user)}{responsibleDepartment(user) ? ` • ${responsibleDepartment(user)}` : ""}
          </option>
        ))}
      </Select>
    </Field>
  );
}