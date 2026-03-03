"use client";

import { useMemo, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import type { Scope } from "@/lib/scope/schema";
import { ServiceCatalog } from "@/lib/catalog/services";
import { Currency } from "@/lib/catalog/enums";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function StepServices() {
  const { control, watch, setValue } = useFormContext<Scope>();
  const { fields, append, remove } = useFieldArray({ control, name: "services" });

  const op = watch("operation.tipo");
  const allowed = useMemo(
    () => ServiceCatalog.filter((s) => s.operations.includes(op)),
    [op]
  );

  const [open, setOpen] = useState(false);
  const [codigo, setCodigo] = useState<string>(allowed[0]?.code ?? "ASSESSORIA");
  const [moeda, setMoeda] = useState<(typeof Currency)[number]>("BRL");
  const [valor, setValor] = useState<string>("");
  const [regra, setRegra] = useState<string>("");

  function addService() {
    append({
      // @ts-expect-error enum narrowing handled by zod at runtime in MVP
      codigo,
      moeda,
      valor: valor ? Number(valor) : null,
      regraCalculo: regra || null,
      descricao: null,
      observacao: null,
    });
    setOpen(false);
    setValor("");
    setRegra("");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Serviços contratados</div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl">Adicionar serviço</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Novo serviço</DialogTitle>
            </DialogHeader>

            <div className="grid gap-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Serviço</div>
                <Select value={codigo} onValueChange={setCodigo}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowed.map((s) => (
                      <SelectItem key={s.code} value={s.code}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Moeda</div>
                  <Select value={moeda} onValueChange={(v) => setMoeda(v as any)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Moeda" />
                    </SelectTrigger>
                    <SelectContent>
                      {Currency.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Valor (opcional)</div>
                  <Input className="rounded-xl" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="ex.: 1518" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Regra de cálculo (opcional)</div>
                <Textarea className="min-h-20 rounded-xl" value={regra} onChange={(e) => setRegra(e.target.value)} placeholder="ex.: 0,99% / PTAX 8%" />
              </div>

              <Button className="rounded-xl" onClick={addService}>
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-2xl p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serviço</TableHead>
              <TableHead>Moeda</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Regra</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((f, idx) => {
              const label = ServiceCatalog.find((s) => s.code === f.codigo)?.label ?? f.codigo;
              return (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{label}</TableCell>
                  <TableCell>{f.moeda}</TableCell>
                  <TableCell>{f.valor ?? "-"}</TableCell>
                  <TableCell className="max-w-[320px] truncate">{f.regraCalculo ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" className="rounded-xl" onClick={() => remove(idx)}>
                      Remover
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}

            {fields.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-sm text-muted-foreground">
                  Nenhum serviço ainda (warning).
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}