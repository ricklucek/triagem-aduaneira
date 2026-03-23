"use client";

import { useEffect, useRef, useState } from "react";
import { EscopoForm } from "@/domain/scope/types";
import { Field, Select, TextInput } from "@/components/ui/form-fields";
import { Grid } from "@/components/ui/form-layout";
import { ResponsiblePicker } from "@/components/scope/ResponsiblePicker";
import type { ScopeResponsible } from "@/lib/api/types/scope-metadata";
import { formatCNPJ } from "@/utils/format";
import { publicApi } from "@/lib/api/services/public";

 type Props = {
  form: EscopoForm;
  errors: Record<string, string>;
  onChange: (next: EscopoForm) => void;
  responsaveis: ScopeResponsible[];
};

export default function StepSobreEmpresa({ form, errors, onChange, responsaveis }: Props) {
  const s = form.sobreEmpresa;
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const lastFetchedRef = useRef<string>("");

  function patch(patchData: Partial<typeof s>) {
    onChange({ ...form, sobreEmpresa: { ...s, ...patchData } });
  }

  useEffect(() => {
    async function lookup() {
      if (s.cnpj.length !== 14 || lastFetchedRef.current === s.cnpj) return;
      setLoadingCnpj(true);
      setLookupError(null);
      try {
        const data = await publicApi.lookupCompanyByCnpj(s.cnpj);
        lastFetchedRef.current = s.cnpj;
        onChange({
          ...form,
          sobreEmpresa: {
            ...form.sobreEmpresa,
            razaoSocial: data.razaoSocial ?? form.sobreEmpresa.razaoSocial,
            inscricaoEstadual: data.inscricaoEstadual ?? form.sobreEmpresa.inscricaoEstadual,
            inscricaoMunicipal: data.inscricaoMunicipal ?? form.sobreEmpresa.inscricaoMunicipal,
            enderecoCompletoEscritorio: data.enderecoCompletoEscritorio ?? form.sobreEmpresa.enderecoCompletoEscritorio,
            enderecoCompletoArmazem: data.enderecoCompletoArmazem ?? form.sobreEmpresa.enderecoCompletoArmazem,
            cnaePrincipal: data.cnaePrincipal ?? form.sobreEmpresa.cnaePrincipal,
            cnaeSecundario: data.cnaesSecundarios?.join(", ") ?? form.sobreEmpresa.cnaeSecundario,
            regimeTributacao: data.regimeTributacao ?? form.sobreEmpresa.regimeTributacao,
          },
        });
      } catch {
        setLookupError("Não foi possível consultar os dados públicos do CNPJ agora.");
      } finally {
        setLoadingCnpj(false);
      }
    }
    void lookup();
  }, [form, onChange, s.cnpj]);

  return (
    <main className="flex flex-col gap-5">
      <Grid columns={2}>
        <Field label="Razão Social" required error={errors["razaoSocial"]}>
          <TextInput invalid={Boolean(errors["razaoSocial"])} value={s.razaoSocial} onChange={(e) => patch({ razaoSocial: e.target.value })} />
        </Field>
        <Field label="CNPJ" required error={errors["cnpj"]} hint={loadingCnpj ? "Consultando Receita Federal..." : lookupError ?? "Ao concluir 14 dígitos, os dados serão buscados automaticamente."}>
          <TextInput
            invalid={Boolean(errors["cnpj"])}
            value={formatCNPJ(s.cnpj)}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              if (raw.length < 14) lastFetchedRef.current = "";
              patch({ cnpj: raw });
            }}
          />
        </Field>
        <Field label="Inscrição Estadual" required error={errors["inscricaoEstadual"]}>
          <TextInput invalid={Boolean(errors["inscricaoEstadual"])} value={s.inscricaoEstadual} onChange={(e) => patch({ inscricaoEstadual: e.target.value })} />
        </Field>
        <Field label="Inscrição Municipal" hint="Campo opcional">
          <TextInput value={s.inscricaoMunicipal ?? ""} onChange={(e) => patch({ inscricaoMunicipal: e.target.value })} />
        </Field>
        <Field label="Endereço completo — escritório" required error={errors["enderecoCompletoEscritorio"]}>
          <TextInput invalid={Boolean(errors["enderecoCompletoEscritorio"])} value={s.enderecoCompletoEscritorio} onChange={(e) => patch({ enderecoCompletoEscritorio: e.target.value })} />
        </Field>
        <Field label="Endereço completo — armazém" hint="Campo opcional">
          <TextInput value={s.enderecoCompletoArmazem ?? ""} onChange={(e) => patch({ enderecoCompletoArmazem: e.target.value })} />
        </Field>
        <Field label="CNAEs secundários" hint="Campo opcional">
          <TextInput value={s.cnaeSecundario ?? ""} onChange={(e) => patch({ cnaeSecundario: e.target.value })} />
        </Field>
        <Field label="CNAE principal" required error={errors["cnaePrincipal"]}>
          <TextInput invalid={Boolean(errors["cnaePrincipal"])} value={s.cnaePrincipal} onChange={(e) => patch({ cnaePrincipal: e.target.value })} />
        </Field>
        <Field label="Regime de tributação" required error={errors["regimeTributacao"]}>
          <Select invalid={Boolean(errors["regimeTributacao"])} value={s.regimeTributacao} onChange={(e) => patch({ regimeTributacao: e.target.value as typeof s.regimeTributacao })}>
            <option value="">Selecione</option>
            <option value="SIMPLES_NACIONAL">Simples Nacional</option>
            <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
            <option value="LUCRO_REAL">Lucro Real</option>
          </Select>
        </Field>
        <ResponsiblePicker
          label="Responsável comercial"
          value={s.responsavelComercial}
          onChange={(value) => patch({ responsavelComercial: value })}
          options={responsaveis}
          filterRoles={["comercial", "admin"]}
          error={errors["responsavelComercial"]}
        />
      </Grid>
    </main>
  );
}
