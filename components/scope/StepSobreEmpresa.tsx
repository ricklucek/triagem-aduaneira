"use client";

import { EscopoForm } from "@/domain/scope/types";
import { Field, Select, TextInput } from "@/components/ui/form-fields";
import { Grid, Section } from "@/components/ui/form-layout";
import { ResponsiblePicker } from "@/components/scope/ResponsiblePicker";
import type { ScopeResponsible } from "@/lib/api/types/scope-metadata";

type Props = {
  form: EscopoForm;
  errors: Record<string, string>;
  onChange: (next: EscopoForm) => void;
  responsaveis: ScopeResponsible[];
};

export default function StepSobreEmpresa({ form, errors, onChange, responsaveis }: Props) {
  const s = form.sobreEmpresa;

  function patch(patchData: Partial<typeof s>) {
    onChange({
      ...form,
      sobreEmpresa: { ...s, ...patchData },
    });
  }

  return (
    <Section title="Sobre a empresa" description="Dados cadastrais principais do cliente.">
      <Grid columns={2}>
        <Field label="Razão Social" required error={errors["sobreEmpresa.razaoSocial"]}>
          <TextInput invalid={Boolean(errors["sobreEmpresa.razaoSocial"])} value={s.razaoSocial} onChange={(e) => patch({ razaoSocial: e.target.value })} />
        </Field>
        <Field label="CNPJ" required error={errors["sobreEmpresa.cnpj"]}>
          <TextInput invalid={Boolean(errors["sobreEmpresa.cnpj"])} value={s.cnpj} onChange={(e) => patch({ cnpj: e.target.value })} />
        </Field>
        <Field label="Inscrição Estadual" required error={errors["sobreEmpresa.inscricaoEstadual"]}>
          <TextInput invalid={Boolean(errors["sobreEmpresa.inscricaoEstadual"])} value={s.inscricaoEstadual} onChange={(e) => patch({ inscricaoEstadual: e.target.value })} />
        </Field>
        <Field label="Inscrição Municipal" hint="Campo opcional">
          <TextInput value={s.inscricaoMunicipal ?? ""} onChange={(e) => patch({ inscricaoMunicipal: e.target.value })} />
        </Field>
        <Field label="Endereço completo — escritório" required error={errors["sobreEmpresa.enderecoCompletoEscritorio"]}>
          <TextInput invalid={Boolean(errors["sobreEmpresa.enderecoCompletoEscritorio"])} value={s.enderecoCompletoEscritorio} onChange={(e) => patch({ enderecoCompletoEscritorio: e.target.value })} />
        </Field>
        <Field label="Endereço completo — armazém" hint="Campo opcional">
          <TextInput value={s.enderecoCompletoArmazem ?? ""} onChange={(e) => patch({ enderecoCompletoArmazem: e.target.value })} />
        </Field>
        <Field label="CNAE secundário" hint="Campo opcional">
          <TextInput value={s.cnaeSecundario ?? ""} onChange={(e) => patch({ cnaeSecundario: e.target.value })} />
        </Field>
        <Field label="CNAE principal" required error={errors["sobreEmpresa.cnaePrincipal"]}>
          <TextInput invalid={Boolean(errors["sobreEmpresa.cnaePrincipal"])} value={s.cnaePrincipal} onChange={(e) => patch({ cnaePrincipal: e.target.value })} />
        </Field>
        <Field label="Regime de tributação" required error={errors["sobreEmpresa.regimeTributacao"]}>
          <Select invalid={Boolean(errors["sobreEmpresa.regimeTributacao"])} value={s.regimeTributacao} onChange={(e) => patch({ regimeTributacao: e.target.value as typeof s.regimeTributacao })}>
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
          error={errors["sobreEmpresa.responsavelComercial"]}
        />
      </Grid>
    </Section>
  );
}
