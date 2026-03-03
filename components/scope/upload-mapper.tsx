"use client";

import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { Scope } from "@/lib/scope/schema";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type ExtractedField = { key: string; value: string; confidence?: number };

const targetPaths = [
  "client.cnpj",
  "client.razaoSocial",
  "contacts[0].email",
  "operation.ncm[]",
  "services[]",
] as const;

function mockExtract(fileName: string): ExtractedField[] {
  // MVP: use o nome do arquivo só pra variar o payload
  return [
    { key: "CNPJ", value: "56.091.724/0001-42", confidence: 0.82 },
    { key: "RAZAO_SOCIAL", value: "Vexos", confidence: 0.76 },
    { key: "EMAIL_CONTATO", value: "comercial@vexos.com.br", confidence: 0.64 },
    { key: "NCM", value: "8471.30.12; 3926.90.90", confidence: 0.58 },
  ];
}

export function UploadMapper() {
  const { setValue, getValues } = useFormContext<Scope>();

  const [file, setFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<ExtractedField[]>([]);
  const [open, setOpen] = useState(false);

  const [mapping, setMapping] = useState<Record<string, string>>({});

  function onChoose(f: File) {
    setFile(f);
    setExtracted(mockExtract(f.name));
    setOpen(true);
  }

  function applyMapping() {
    for (const ef of extracted) {
      const path = mapping[ef.key];
      if (!path) continue;

      if (path === "client.cnpj") setValue("client.cnpj", ef.value);
      if (path === "client.razaoSocial") setValue("client.razaoSocial", ef.value);
      if (path === "contacts[0].email") {
        const contacts = getValues("contacts");
        if (!contacts?.length) setValue("contacts", [{ email: ef.value } as any]);
        else setValue("contacts.0.email", ef.value);
      }
      if (path === "operation.ncm[]") {
        const list = ef.value.split(/[;,]/).map(s => s.trim()).filter(Boolean);
        setValue("operation.ncm", list);
      }
      if (path === "services[]") {
        // MVP: você pode interpretar no backend; aqui só demonstra o hook
      }
    }

    setOpen(false);
  }

  return (
    <Card className="rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">Uploads + Mapeamento</div>
          <div className="text-xs text-muted-foreground">docx/pdf/xlsx • até 100MB • extração mockada</div>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="file"
            className="hidden"
            accept=".pdf,.docx,.xlsx"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onChoose(f);
            }}
          />
          <Button className="rounded-xl">Enviar documento</Button>
        </label>
      </div>

      {file && (
        <div className="mt-3 text-xs text-muted-foreground">
          Arquivo atual: <span className="font-medium">{file.name}</span>{" "}
          <Badge variant="outline" className="ml-2">mock</Badge>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mapear campos extraídos</DialogTitle>
          </DialogHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campo extraído</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Destino no formulário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {extracted.map((ef) => (
                <TableRow key={ef.key}>
                  <TableCell className="font-medium">
                    {ef.key}{" "}
                    {typeof ef.confidence === "number" && (
                      <Badge variant="secondary" className="ml-2">
                        {Math.round(ef.confidence * 100)}%
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-70 truncate">{ef.value}</TableCell>
                  <TableCell>
                    <Select
                      value={mapping[ef.key] ?? ""}
                      onValueChange={(v) => setMapping((m) => ({ ...m, [ef.key]: v }))}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecione o campo destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {targetPaths.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button className="rounded-xl" onClick={applyMapping}>
              Aplicar no formulário
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}