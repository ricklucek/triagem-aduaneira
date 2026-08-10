"use client";

import { useState } from "react";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";

import type { EscopoForm } from "@/domain/scope/types";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/form-fields";
import { Grid, Stack } from "@/components/ui/form-layout";

type FreteInternacional = NonNullable<
  NonNullable<EscopoForm["servicos"]["importacao"]>["freteInternacional"]
>;

type PrestadorTerceiro = FreteInternacional["prestadoresTerceiros"][number];

type Props = {
  prestadores: FreteInternacional["prestadoresTerceiros"];
  errors: Record<string, string>;
  onChange: (prestadores: FreteInternacional["prestadoresTerceiros"]) => void;
};

const prestadorVazio: PrestadorTerceiro = {
  empresa: "",
  nomeSistema: "",
  url: "",
  login: "",
  senha: "",
  contato: "",
  observacoes: "",
};

export function PrestadoresFreteInternacional({
  prestadores,
  errors,
  onChange,
}: Props) {
  const [senhasVisiveis, setSenhasVisiveis] = useState<Set<number>>(new Set());

  function adicionarPrestador() {
    onChange([...prestadores, { ...prestadorVazio }]);
  }

  function atualizarPrestador<K extends keyof PrestadorTerceiro>(
    index: number,
    campo: K,
    valor: PrestadorTerceiro[K],
  ) {
    onChange(
      prestadores.map((prestador, itemIndex) =>
        itemIndex === index ? { ...prestador, [campo]: valor } : prestador,
      ),
    );
  }

  function removerPrestador(index: number) {
    onChange(prestadores.filter((_, itemIndex) => itemIndex !== index));
    setSenhasVisiveis((current) => {
      const next = new Set<number>();
      current.forEach((itemIndex) => {
        if (itemIndex < index) next.add(itemIndex);
        if (itemIndex > index) next.add(itemIndex - 1);
      });
      return next;
    });
  }

  function alternarSenha(index: number) {
    setSenhasVisiveis((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <Stack gap={12}>
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Prestadores terceiros</p>
          <p className="text-xs text-muted-foreground">
            Cadastre as empresas e as credenciais usadas para acessar seus
            sistemas.
          </p>
          {errors["freteInternacional.prestadoresTerceiros"] ? (
            <p className="mt-2 text-sm font-medium text-destructive">
              {errors["freteInternacional.prestadoresTerceiros"]}
            </p>
          ) : null}
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={adicionarPrestador}
        >
          <Plus className="size-4" />
          Adicionar prestador
        </Button>
      </div>

      {prestadores.map((prestador, index) => {
        const prefixo = `freteInternacional.prestadoresTerceiros.${index}`;
        const senhaVisivel = senhasVisiveis.has(index);

        return (
          <div
            key={index}
            className="rounded-xl border border-border bg-background p-4 shadow-xs"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Prestador {index + 1}</p>
                {prestador.empresa ? (
                  <p className="text-xs text-muted-foreground">
                    {prestador.empresa}
                  </p>
                ) : null}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remover prestador ${index + 1}`}
                title={`Remover prestador ${index + 1}`}
                onClick={() => removerPrestador(index)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>

            <Grid columns={2}>
              <Field
                label="Empresa"
                required
                error={errors[`${prefixo}.empresa`]}
              >
                <TextInput
                  value={prestador.empresa}
                  invalid={Boolean(errors[`${prefixo}.empresa`])}
                  onChange={(event) =>
                    atualizarPrestador(index, "empresa", event.target.value)
                  }
                />
              </Field>

              <Field label="Nome do sistema" hint="Campo opcional">
                <TextInput
                  value={prestador.nomeSistema}
                  onChange={(event) =>
                    atualizarPrestador(index, "nomeSistema", event.target.value)
                  }
                />
              </Field>

              <Field
                label="URL do sistema"
                hint="Campo opcional"
                error={errors[`${prefixo}.url`]}
              >
                <TextInput
                  type="url"
                  placeholder="https://"
                  value={prestador.url}
                  invalid={Boolean(errors[`${prefixo}.url`])}
                  onChange={(event) =>
                    atualizarPrestador(index, "url", event.target.value)
                  }
                />
              </Field>

              <Field label="Contato" hint="Campo opcional">
                <TextInput
                  value={prestador.contato}
                  onChange={(event) =>
                    atualizarPrestador(index, "contato", event.target.value)
                  }
                />
              </Field>

              <Field label="Login" required error={errors[`${prefixo}.login`]}>
                <TextInput
                  autoComplete="off"
                  value={prestador.login}
                  invalid={Boolean(errors[`${prefixo}.login`])}
                  onChange={(event) =>
                    atualizarPrestador(index, "login", event.target.value)
                  }
                />
              </Field>

              <Field label="Senha" required error={errors[`${prefixo}.senha`]}>
                <div className="relative">
                  <TextInput
                    type={senhaVisivel ? "text" : "password"}
                    autoComplete="new-password"
                    className="pr-11"
                    value={prestador.senha}
                    invalid={Boolean(errors[`${prefixo}.senha`])}
                    onChange={(event) =>
                      atualizarPrestador(index, "senha", event.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={
                      senhaVisivel ? "Ocultar senha" : "Revelar senha"
                    }
                    title={senhaVisivel ? "Ocultar senha" : "Revelar senha"}
                    onClick={() => alternarSenha(index)}
                  >
                    {senhaVisivel ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </Field>
            </Grid>

            <div className="mt-4">
              <Field label="Observações" hint="Campo opcional">
                <TextArea
                  value={prestador.observacoes}
                  onChange={(event) =>
                    atualizarPrestador(index, "observacoes", event.target.value)
                  }
                />
              </Field>
            </div>
          </div>
        );
      })}
    </Stack>
  );
}
