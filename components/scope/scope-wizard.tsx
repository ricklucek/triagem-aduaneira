"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useScopeStore } from "@/lib/scope/use-scope-store";

import { useForm, FormProvider, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ScopeSchema, defaultScope, type Scope } from "@/lib/scope/schema";
import { getScopeWarnings } from "@/lib/scope/warnings";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

import { StepClient } from "./steps/step-client";
import { StepContacts } from "./steps/step-contacts";
import { StepOperation } from "./steps/step-operation";
import { StepServices } from "./steps/step-services";
import { StepReview } from "./steps/step-review";

const steps = ["Cliente", "Contatos", "Operação", "Serviços", "Revisão"] as const;

export function ScopeWizard({
  cnpj,
  initialScope,
  draftId: draftIdProp,
}: {
  cnpj: string;
  initialScope?: Scope;
  draftId?: string | null;
}) {
  const [step, setStep] = useState(0);

  const { upsertDraft, publish } = useScopeStore(cnpj);
  const [draftId, setDraftId] = useState<string | null>(draftIdProp ?? null);

  const form = useForm<Scope>({
    resolver: zodResolver(ScopeSchema) as Resolver<Scope>,
    defaultValues: initialScope
      ? initialScope
      : { ...defaultScope, client: { ...defaultScope.client, cnpj } },
    mode: "onChange",
  });

  const value = useWatch({ control: form.control }) as Scope;
  const warnings = useMemo(() => getScopeWarnings(value), [value]);
  const progress = ((step + 1) / steps.length) * 100;

  function next() {
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }
  function prev() {
    setStep((s) => Math.max(s - 1, 0));
  }

  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    // debounce simples
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      const rec = upsertDraft(draftId, form.getValues());
      if (!draftId) setDraftId(rec.id);
    }, 900);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [draftId, form, upsertDraft, value]); // value = watch

  function publishSnapshot() {
    // garante que existe draft salvo
    const draft = upsertDraft(draftId, form.getValues());
    if (!draftId) setDraftId(draft.id);

    const pub = publish(draft.id, form.getValues());
    alert(`Publicado! Versão v${pub.version} criada.\n\nID: ${pub.id}`);
  }

  useEffect(() => {
    if (initialScope) form.reset(initialScope);
  }, [form, initialScope]);

  return (
    <FormProvider {...form}>
      <div className="grid gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Novo Escopo • Cliente {cnpj}</CardTitle>
                <div className="text-sm text-muted-foreground">Wizard • draft/published • versão imutável após publicar</div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary">status: {value.meta.status}</Badge>
                <Badge variant="outline">v{value.meta.version}</Badge>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="rounded-xl">
                      Warnings ({warnings.length})
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-lg">
                    <SheetHeader>
                      <SheetTitle>Alertas de completude</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 space-y-2">
                      {warnings.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Sem alertas.</div>
                      ) : (
                        warnings.map((w, i) => (
                          <Alert key={`${w.path}-${i}`} className="rounded-xl">
                            <AlertTitle className="text-sm">{w.path}</AlertTitle>
                            <AlertDescription className="text-sm">{w.message}</AlertDescription>
                          </Alert>
                        ))
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <Separator />
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium">
                Passo {step + 1} de {steps.length}: {steps[step]}
              </div>
              <div className="w-56">
                <Progress value={progress} />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {warnings.length > 0 && (
              <Alert className="rounded-xl">
                <AlertTitle>Atenção</AlertTitle>
                <AlertDescription>
                  O MVP não bloqueia o envio, mas recomenda preencher os itens sinalizados. Warnings: {warnings.length}
                </AlertDescription>
              </Alert>
            )}

            {step === 0 && <StepClient />}
            {step === 1 && <StepContacts />}
            {step === 2 && <StepOperation />}
            {step === 3 && <StepServices />}
            {step === 4 && <StepReview onPublish={publishSnapshot} />}

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={prev} disabled={step === 0} className="rounded-xl">
                Voltar
              </Button>
              {step < steps.length - 1 ? (
                <Button onClick={next} className="rounded-xl">
                  Avançar
                </Button>
              ) : (
                <Button onClick={publishSnapshot} className="rounded-xl">
                  Publicar (snapshot)
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </FormProvider>
  );
}