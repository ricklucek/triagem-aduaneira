"use client";

import React from "react";

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
    <label style={{ display: "block" }}>
      <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
        {label} {required ? <span style={{ color: "#b42318" }}>*</span> : null}
      </div>
      {children}
      {hint ? (
        <div style={{ marginTop: 6, fontSize: 12, color: "#667085" }}>{hint}</div>
      ) : null}
      {error ? (
        <div style={{ marginTop: 6, fontSize: 12, color: "#b42318" }}>{error}</div>
      ) : null}
    </label>
  );
}

const baseInputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #d0d5dd",
  borderRadius: 10,
  padding: "10px 12px",
  outline: "none",
  background: "#fff",
  fontSize: 14,
  color: "#101828",
};

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return <input {...props} style={{ ...baseInputStyle, ...(props.style || {}) }} />;
}

export function NumberInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      type="number"
      {...props}
      style={{ ...baseInputStyle, ...(props.style || {}) }}
    />
  );
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      style={{
        ...baseInputStyle,
        minHeight: 100,
        resize: "vertical",
        ...(props.style || {}),
      }}
    />
  );
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement>
) {
  return (
    <select
      {...props}
      style={{ ...baseInputStyle, ...(props.style || {}) }}
    />
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        padding: "10px 12px",
        border: "1px solid #eaecf0",
        borderRadius: 10,
        background: "#fff",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
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
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
      }}
    >
      <strong>{title}</strong>
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span>Habilitado</span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
      </label>
    </div>
  );
}