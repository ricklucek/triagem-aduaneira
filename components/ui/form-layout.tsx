"use client";

import React from "react";
import { Button } from "./button";
import { Card } from "./card";
import { cn } from "@/lib/utils";

export function PageShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("rounded-[2rem] border-border/80 p-4 shadow-sm sm:p-6 lg:p-8", className)}>
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </Card>
  );
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode; }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle ? <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">{subtitle}</p> : null}
      </div>
      {right ? <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-end">{right}</div> : null}
    </div>
  );
}

export function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode; }) {
  return (
    <Card className="gap-5 rounded-[1.75rem] border-border/80 p-5 shadow-sm sm:p-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground sm:text-base">{description}</p> : null}
      </div>
      {children}
    </Card>
  );
}

export function Grid({ children, columns = 2 }: { children: React.ReactNode; columns?: 1 | 2 | 3; }) {
  const cols = columns === 1 ? "lg:grid-cols-1" : columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";
  return <div className={cn("grid grid-cols-1 gap-4 md:gap-5", cols)}>{children}</div>;
}

export function Stack({ children, gap = 16 }: { children: React.ReactNode; gap?: number; }) {
  return <div style={{ display: "grid", gap }}>{children}</div>;
}

export function Divider() { return <div className="my-4 h-px bg-border" />; }

export function Toolbar({ left, right }: { left?: React.ReactNode; right?: React.ReactNode; }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">{left}</div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">{right}</div>
    </div>
  );
}

export function StepPills({ steps, currentIndex }: { steps: string[]; currentIndex: number; }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {steps.map((step, idx) => {
        const active = idx === currentIndex;
        return (
          <div key={step} className={cn("rounded-full border px-4 py-2 text-sm font-medium transition-colors", active ? "border-foreground bg-muted text-foreground" : "border-border bg-background text-muted-foreground")}>
            {step}
          </div>
        );
      })}
    </div>
  );
}

export function AlertWarning({ title, items }: { title: string; items?: string[]; }) {
  return (
    <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-destructive">
      <strong className="text-sm sm:text-base">{title}</strong>
      {items && items.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {items.map((item, idx) => <li key={`${item}-${idx}`}>{item}</li>)}
        </ul>
      ) : null}
    </div>
  );
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <Button {...props} />; }

export function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <Button {...props} variant="outline" />; }

export function DangerButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) { return <Button {...props} variant="destructive" />; }

export { Card };
