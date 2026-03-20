"use client";

import React from "react";
import { Button } from "./button";
import { Card } from "./card";
import { cn } from "@/lib/utils";
import { ListFilter, Search } from "lucide-react";

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
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
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

export function Toolbar({
  title,
  description,
  left,
  right,
  sticky = false,
  className,
}: {
  title?: string;
  description?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  sticky?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-background/80 p-4 shadow-sm backdrop-blur-sm",
        "transition-all duration-300",
        sticky && "sticky top-4 z-20",
        className
      )}
    >
      {(title || description) && (
        <div className="mb-4 flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ListFilter className="size-4" />
          </div>

          <div className="min-w-0">
            {title ? (
              <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {left}
        </div>

        {right ? (
          <div className="h-px w-full bg-border lg:hidden" />
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
          {right}
        </div>
      </div>
    </div>
  );
}

export function ToolbarGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center",
        className
      )}
    >
      {children}
    </div>
  );
}

export function ToolbarField({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full sm:w-auto", className)}>
      {children}
    </div>
  );
}

export function ToolbarSearchField({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full sm:min-w-[20rem] sm:flex-1", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      {children}
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
