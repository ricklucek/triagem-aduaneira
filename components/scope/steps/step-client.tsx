"use client";

import { useFormContext } from "react-hook-form";
import type { Scope } from "@/lib/scope/schema";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadMapper } from "@/components/scope/upload-mapper";
import { TaxRegime } from "@/lib/catalog/enums";

function StepClient() {
  const { register, setValue, watch } = useFormContext<Scope>();
  const regime = watch("client.regimeTributario") ?? "";

  return (
    <div className="space-y-4">
      <UploadMapper />

      <Card className="rounded-2xl p-4">
        <div className="mb-3 text-sm font-semibold">Dados do cliente</div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">CNPJ (chave)</div>
            <Input className="rounded-xl" placeholder="00.000.000/0000-00" {...register("client.cnpj")} />
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Razão social</div>
            <Input className="rounded-xl" placeholder="Razão social" {...register("client.razaoSocial")} />
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Nome fantasia</div>
            <Input className="rounded-xl" placeholder="Nome fantasia" {...register("client.nomeFantasia")} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">IE</div>
              <Input className="rounded-xl" {...register("client.ie")} />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">IM</div>
              <Input className="rounded-xl" {...register("client.im")} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Regime tributário</div>
            <Select
              value={regime}
              onValueChange={(v) => setValue("client.regimeTributario", v as any, { shouldDirty: true })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {TaxRegime.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r === "SIMPLES" ? "Simples" : r === "LUCRO_REAL" ? "Lucro Real" : "Lucro Presumido"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Responsável comercial</div>
            <Input className="rounded-xl" {...register("client.responsavelComercial")} />
          </div>

          <div className="space-y-1 md:col-span-2">
            <div className="text-xs text-muted-foreground">Endereço do escritório</div>
            <Input className="rounded-xl" {...register("client.enderecoEscritorio")} />
          </div>

          <div className="space-y-1 md:col-span-2">
            <div className="text-xs text-muted-foreground">Endereço do armazém</div>
            <Input className="rounded-xl" {...register("client.enderecoArmazem")} />
          </div>
        </div>
      </Card>
    </div>
  );
}

export default StepClient;