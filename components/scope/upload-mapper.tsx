"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { Scope } from "@/lib/scope/schema";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { parseCnpjLoose, parseNcmList, parseOperationTypes, parseYesNo } from "@/lib/normalize";
import { resolveCatalogIdsList } from "@/lib/catalog/catalog-normalizer";

import { EntryLocations, ReleaseWarehouses, ExportPortsAndBorders } from "@/lib/catalog/locations";
import { AnuenciasOrgaos } from "@/lib/catalog/anuencias";

import { guessTargetPath } from "@/lib/scope/guess-mapping";

import { inferDocType, loadTemplate, saveTemplate } from "@/lib/scope/mapping-store";

type ExtractedField = { key: string; value: string; confidence?: number };

// Destinos suportados no MVP (você pode expandir livremente)
const targetPaths = [
  "client.cnpj",
  "client.razaoSocial",
  "contacts[0].email",

  "operation.types[]",

  "importSection.ncm[]",
  "importSection.entryLocations[]",
  "importSection.releaseWarehouses[]",

  "importSection.liLpco.enabled",
  "importSection.liLpco.anuencias[]",

  "exportSection.ncm[]",
  "exportSection.departureLocations[]",
] as const;

function mockExtract(fileName: string): ExtractedField[] {
  // MVP: simula extração
  return [
    { key: "CNPJ", value: "56.091.724/0001-42", confidence: 0.82 },
    { key: "RAZAO_SOCIAL", value: "Vexos", confidence: 0.76 },
    { key: "OPERACAO", value: "Importação e Exportação", confidence: 0.74 },

    { key: "EMAIL_CONTATO", value: "comercial@vexos.com.br", confidence: 0.64 },

    { key: "LOCAL_ENTRADA", value: "Viracopos (VCP); Guarulhos (GRU)", confidence: 0.58 },
    { key: "ARMAZEM_LIBERACAO", value: "Zona Secundária (Armazém)", confidence: 0.61 },

    { key: "NCM", value: "8471.30.12; 3926.90.90", confidence: 0.58 },

    { key: "LI_LPCO", value: "Sim", confidence: 0.62 },
    { key: "ANUENCIAS", value: "ANVISA; MAPA", confidence: 0.54 },

    { key: "PORTOS_FRONTEIRAS", value: "Porto de Santos; Foz do Iguaçu", confidence: 0.55 },
    { key: "NCM_EXPORT", value: "0901.21.00", confidence: 0.49 },
  ];
}

export function UploadMapper() {
  const { setValue, getValues } = useFormContext<Scope>();

  const [file, setFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<ExtractedField[]>([]);
  const [open, setOpen] = useState(false);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const currentCnpj = (getValues("client.cnpj") ?? "").toString();

  function onChoose(f: File) {
    const data = mockExtract(f.name);
    const docType = inferDocType(f.name);

    // 1) tenta template
    const tpl = currentCnpj ? loadTemplate(currentCnpj, docType) : null;

    // 2) se não tiver template, usa auto-guess
    const initial: Record<string, string> = {};
    if (tpl?.mapping) {
      // reaproveita o mapping salvo, mas só aplica para chaves presentes na extração atual
      for (const ef of data) {
        if (tpl.mapping[ef.key]) initial[ef.key] = tpl.mapping[ef.key];
      }
    } else {
      for (const ef of data) {
        const g = guessTargetPath(ef.key, ef.value);
        if (g.path) initial[ef.key] = g.path;
      }
    }

    setFile(f);
    setExtracted(data);
    setMapping(initial);
    setOpen(true);

    // dica rápida no MVP
    if (!currentCnpj) {
      // não bloqueia, mas avisa
      console.info("CNPJ vazio: template por cliente não será aplicado/salvo.");
    }
  }

  function applyMapping() {
    const unmatchedSummary: Record<string, string[]> = {};

    for (const ef of extracted) {
      const path = mapping[ef.key];
      if (!path) continue;

      // CLIENT
      if (path === "client.cnpj") {
        setValue("client.cnpj", parseCnpjLoose(ef.value), { shouldDirty: true });
        continue;
      }

      if (path === "client.razaoSocial") {
        setValue("client.razaoSocial", ef.value.trim(), { shouldDirty: true });
        continue;
      }

      if (path === "contacts[0].email") {
        const contacts = getValues("contacts");
        if (!contacts?.length) setValue("contacts", [{ email: ef.value.trim() } as any], { shouldDirty: true });
        else setValue("contacts.0.email", ef.value.trim(), { shouldDirty: true });
        continue;
      }

      // OP TYPES
      if (path === "operation.types[]") {
        const ops = parseOperationTypes(ef.value);
        setValue("operation.types", ops as any, { shouldDirty: true });
        continue;
      }

      // IMPORT ARRAYS
      if (path === "importSection.ncm[]") {
        setValue("importSection.ncm", parseNcmList(ef.value), { shouldDirty: true });
        continue;
      }

      if (path === "importSection.entryLocations[]") {
        const { ids, unmatched } = resolveCatalogIdsList(ef.value, EntryLocations as any);
        setValue("importSection.entryLocations", ids, { shouldDirty: true });
        if (unmatched.length) unmatchedSummary[path] = unmatched;
        continue;
      }

      if (path === "importSection.releaseWarehouses[]") {
        const { ids, unmatched } = resolveCatalogIdsList(ef.value, ReleaseWarehouses as any);
        setValue("importSection.releaseWarehouses", ids, { shouldDirty: true });
        if (unmatched.length) unmatchedSummary[path] = unmatched;
        continue;
      }

      // LI/LPCO
      if (path === "importSection.liLpco.enabled") {
        const b = parseYesNo(ef.value);
        if (b !== null) {
          setValue("importSection.liLpco.enabled", b, { shouldDirty: true });
          if (!b) setValue("importSection.liLpco.anuencias", [], { shouldDirty: true });
        }
        continue;
      }

      if (path === "importSection.liLpco.anuencias[]") {
        const { ids, unmatched } = resolveCatalogIdsList(ef.value, AnuenciasOrgaos as any);
        setValue("importSection.liLpco.anuencias", ids, { shouldDirty: true });
        // se tem anuência, força enabled
        if (ids.length) setValue("importSection.liLpco.enabled", true, { shouldDirty: true });
        if (unmatched.length) unmatchedSummary[path] = unmatched;
        continue;
      }

      // EXPORT ARRAYS
      if (path === "exportSection.ncm[]") {
        setValue("exportSection.ncm", parseNcmList(ef.value), { shouldDirty: true });
        continue;
      }

      if (path === "exportSection.departureLocations[]") {
        const { ids, unmatched } = resolveCatalogIdsList(ef.value, ExportPortsAndBorders as any);
        setValue("exportSection.departureLocations", ids, { shouldDirty: true });
        if (unmatched.length) unmatchedSummary[path] = unmatched;
        continue;
      }
    }

    // salva template por cliente + tipo de doc (se houver CNPJ)
    if (file && currentCnpj) {
      const docType = inferDocType(file.name);
      saveTemplate(currentCnpj, docType, mapping);
    }

    setOpen(false);

    const keys = Object.keys(unmatchedSummary);
    if (keys.length) {
      const lines = keys
        .map((k) => `• ${k}: ${unmatchedSummary[k].join(", ")}`)
        .join("\n");
      alert(
        "Aplicado com avisos.\n\nAlguns valores não foram reconhecidos no catálogo e foram ignorados:\n\n" + lines +
        "\n\nSugestão: adicione essas opções ao catálogo hardcoded para melhorar o auto-match."
      );
    }
  }

  return (
    <Card className="rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">Uploads + Mapeamento</div>
          <div className="text-xs text-muted-foreground">docx/pdf/xlsx • até 100MB • extração mockada + normalização</div>
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
          <Badge variant="outline" className="ml-2">
            mock
          </Badge>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Mapear campos extraídos <span className="text-xs text-muted-foreground">(com template por cliente)</span></DialogTitle>
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
              {extracted.map((ef) => {
                const g = guessTargetPath(ef.key, ef.value);
                return (
                  <TableRow key={ef.key}>
                    <TableCell className="font-medium">
                      {ef.key}{" "}
                      {typeof ef.confidence === "number" && (
                        <Badge variant="secondary" className="ml-2">
                          {Math.round(ef.confidence * 100)}%
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-85 truncate">{ef.value}</TableCell>
                    <TableCell>
                      {g.path ? (
                        <div className="mb-1 flex items-center gap-2">
                          <Badge variant={g.confidence >= 0.8 ? "default" : "secondary"} className="rounded-xl">
                            sugestão {Math.round(g.confidence * 100)}%
                          </Badge>
                          <div className="text-xs text-muted-foreground">{g.reason}</div>
                        </div>
                      ) : (
                        <div className="mb-1 text-xs text-muted-foreground">sem sugestão</div>
                      )}

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
                )
              })}
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