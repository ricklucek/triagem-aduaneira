"use client";

import React from "react";
import { Button } from "./button";
import { Card } from "./card";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl p-4">
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>{children}</div>
    </Card>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16,
        marginBottom: 20,
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: 28 }}>{title}</h1>
        {subtitle ? (
          <p style={{ margin: "8px 0 0", color: "#475467" }}>{subtitle}</p>
        ) : null}
      </div>
      {right}
    </div>
  );
}

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
        {description ? (
          <p style={{ margin: "6px 0 0", color: "#475467", fontSize: 14 }}>
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </Card>
  );
}

export function Grid({
  children,
  columns = 2,
}: {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: 16,
      }}
    >
      {children}
    </div>
  );
}

export function Stack({
  children,
  gap = 16,
}: {
  children: React.ReactNode;
  gap?: number;
}) {
  return <div style={{ display: "grid", gap }}>{children}</div>;
}

export function Divider() {
  return <div style={{ height: 1, background: "#eaecf0", margin: "16px 0" }} />;
}

export function Toolbar({
  left,
  right,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{left}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{right}</div>
    </div>
  );
}

export function StepPills({
  steps,
  currentIndex,
}: {
  steps: string[];
  currentIndex: number;
}) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
      {steps.map((step, idx) => {
        const active = idx === currentIndex;
        return (
          <div
            key={step}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: active ? "1px solid #2e90fa" : "1px solid #d0d5dd",
              background: active ? "#eff8ff" : "#fff",
              color: active ? "#175cd3" : "#344054",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {step}
          </div>
        );
      })}
    </div>
  );
}

export function AlertWarning({
  title,
  items,
}: {
  title: string;
  items?: string[];
}) {
  return (
    <div
      style={{
        background: "#fffaeb",
        border: "1px solid #fedf89",
        color: "#7a2e0e",
        padding: 14,
        borderRadius: 12,
      }}
    >
      <strong>{title}</strong>
      {items && items.length > 0 ? (
        <ul style={{ margin: "10px 0 0", paddingLeft: 18 }}>
          {items.map((item, idx) => (
            <li key={`${item}-${idx}`}>{item}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function PrimaryButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <Button
      {...props}
      style={{
        ...props.style,
      }}
    />
  );
}

export function SecondaryButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <button
      {...props}
      style={{
        border: "1px solid #d0d5dd",
        background: "#fff",
        color: "#344054",
        padding: "10px 16px",
        borderRadius: 10,
        cursor: "pointer",
        fontWeight: 600,
        ...props.style,
      }}
    />
  );
}

export function DangerButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <button
      {...props}
      style={{
        border: "1px solid #fda29b",
        background: "#fff5f5",
        color: "#b42318",
        padding: "10px 16px",
        borderRadius: 10,
        cursor: "pointer",
        fontWeight: 600,
        ...props.style,
      }}
    />
  );
}