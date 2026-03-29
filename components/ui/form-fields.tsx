"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";

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
    <label className="block space-y-2.5">
      <div
        className={cn(
          "text-sm font-semibold text-foreground",
          error && "text-destructive",
        )}
      >
        {label} {required ? <span className="text-destructive">*</span> : null}
      </div>
      {children}
      {hint ? (
        <div className="text-xs text-muted-foreground">{hint}</div>
      ) : null}
      {error ? (
        <div className="text-sm font-medium text-destructive">{error}</div>
      ) : null}
    </label>
  );
}

const baseInputStyle =
  "w-full min-w-0 rounded-xl border bg-background px-3.5 py-2.5 text-sm shadow-xs outline-none transition-[border-color,box-shadow,background-color] focus-visible:ring-[3px] focus-visible:ring-ring/40";

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean },
) {
  const { className, invalid, ...rest } = props;
  return (
    <input
      {...rest}
      aria-invalid={invalid}
      className={cn(
        baseInputStyle,
        invalid ? "border-destructive bg-destructive/5" : "border-input",
        className,
      )}
    />
  );
}

export function NumberInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean },
) {
  const { className, invalid, ...rest } = props;
  return (
    <input
      type="number"
      {...rest}
      aria-invalid={invalid}
      className={cn(
        baseInputStyle,
        invalid ? "border-destructive bg-destructive/5" : "border-input",
        className,
      )}
    />
  );
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    invalid?: boolean;
  },
) {
  const { className, invalid, ...rest } = props;
  return (
    <textarea
      {...rest}
      aria-invalid={invalid}
      className={cn(
        baseInputStyle,
        "min-h-28 resize-y",
        invalid ? "border-destructive bg-destructive/5" : "border-input",
        className,
      )}
    />
  );
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean },
) {
  const { className, invalid, ...rest } = props;
  return (
    <select
      {...rest}
      aria-invalid={invalid}
      className={cn(
        baseInputStyle,
        invalid ? "border-destructive bg-destructive/5" : "border-input",
        className,
      )}
    />
  );
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
        "flex items-center gap-3 rounded-xl border bg-background px-4 py-3 text-sm transition-colors",
        error
          ? "border-destructive bg-destructive/5"
          : "border-border hover:bg-muted/40",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-primary"
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
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={[
        "group w-full rounded-xl text-left transition-all duration-300",
        "hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30",
        "cursor-pointer",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-4 p-1">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={[
              "flex size-6 shrink-0 items-center justify-center rounded-full transition-all duration-300",
              checked
                ? "bg-primary/10 text-primary scale-100"
                : "bg-muted text-muted-foreground scale-95 group-hover:scale-100",
            ].join(" ")}
          >
            {checked ? (
              <CheckCircle2 className="size-5" />
            ) : (
              <Circle className="size-4" />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">
              {checked ? "Habilitado" : "Desabilitado"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={[
              "text-xs font-medium transition-colors duration-300",
              checked ? "text-primary" : "text-muted-foreground",
            ].join(" ")}
          >
            {checked ? "Ativo" : "Inativo"}
          </span>

          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-none sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
      </div>
    </button>
  );
}
