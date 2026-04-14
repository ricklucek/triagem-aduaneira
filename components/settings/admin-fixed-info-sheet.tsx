"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { organizationSettingsApi } from "@/lib/api/services/organization-settings";
import type { AdminSettingsResponse } from "@/lib/api/types/scope-metadata";

export function AdminFixedInfoSheet({ initial }: { initial: AdminSettingsResponse }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initial);

  const onSave = async () => {
    setSaving(true);
    await organizationSettingsApi.updateSettings(form);
    setSaving(false);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full justify-start">Informações fixas</Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Informações fixas</SheetTitle>
        </SheetHeader>
        <div className="mt-6 grid gap-4">
          <Field label="Salário mínimo vigente">
            <Input type="number" value={form.salarioMinimoVigente} onChange={(e) => setForm({ ...form, salarioMinimoVigente: Number(e.target.value) })} />
          </Field>
          <Field label="Banco"><Input value={form.dadosBancariosCasco.banco} onChange={(e) => setForm({ ...form, dadosBancariosCasco: { ...form.dadosBancariosCasco, banco: e.target.value } })} /></Field>
          <Field label="Agência"><Input value={form.dadosBancariosCasco.agencia} onChange={(e) => setForm({ ...form, dadosBancariosCasco: { ...form.dadosBancariosCasco, agencia: e.target.value } })} /></Field>
          <Field label="Conta"><Input value={form.dadosBancariosCasco.conta} onChange={(e) => setForm({ ...form, dadosBancariosCasco: { ...form.dadosBancariosCasco, conta: e.target.value } })} /></Field>
          <Button onClick={onSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
