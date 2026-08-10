"use client";

import React from "react";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <div className="mt-1 text-xs text-destructive">{message}</div>;
}

export function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4 rounded-xl border border-border bg-card p-4 text-card-foreground">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {children}
    </section>
  );
}

export function Grid({
  children,
  columns = 2,
}: {
  children: React.ReactNode;
  columns?: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-input bg-background px-3 py-2.5 text-foreground ${props.className ?? ""}`}
    />
  );
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={`min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-foreground ${props.className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-input bg-background px-3 py-2.5 text-foreground ${props.className ?? ""}`}
    />
  );
}

export function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

export function InlineActions({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {children}
    </div>
  );
}
