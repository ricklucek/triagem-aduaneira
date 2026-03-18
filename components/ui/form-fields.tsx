"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <div className="text-sm font-semibold">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </div>
      {children}
      {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
      {error ? <div className="text-xs text-destructive">{error}</div> : null}
    </label>
  );
}

const baseInputStyle =
  "w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const { className, invalid, ...rest } = props;
  return <input {...rest} aria-invalid={invalid} className={cn(baseInputStyle, invalid ? "border-destructive" : "border-input", className)} />;
}

export function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const { className, invalid, ...rest } = props;
  return <input type="number" {...rest} aria-invalid={invalid} className={cn(baseInputStyle, invalid ? "border-destructive" : "border-input", className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  const { className, invalid, ...rest } = props;
  return <textarea {...rest} aria-invalid={invalid} className={cn(baseInputStyle, "min-h-28 resize-y", invalid ? "border-destructive" : "border-input", className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  const { className, invalid, ...rest } = props;
  return <select {...rest} aria-invalid={invalid} className={cn(baseInputStyle, invalid ? "border-destructive" : "border-input", className)} />;
}

export function Checkbox({
  checked,
  onChange,
  label,
  error,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  error?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-background px-3 py-2 text-sm",
        error ? "border-destructive" : "border-border"
      )}
    >
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function ToggleHeader({
  title,
  checked,
  onChange,
}: {
  title: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <strong className="text-sm md:text-base">{title}</strong>
      <label className="flex items-center gap-2 text-sm">
        <span>Habilitado</span>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      </label>
    </div>
  );
}
