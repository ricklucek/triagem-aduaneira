"use client";

import { EscopoForm } from "@/domain/scope/types";
import { Field, Select, TextInput } from "@/components/ui/form-fields";
import { Grid, Section } from "@/components/ui/form-layout";

type Props = {
  form: EscopoForm;
  errors: Record<string, string>;
  onChange: (next: EscopoForm) => void;
};

export default function StepSobreEmpresa({ form, errors, onChange }: Props) {
  const s = form.sobreEmpresa;

  function patch(patchData: Partial<typeof s>) {
    onChange({
      ...form,
      sobreEmpresa: { ...s, ...patchData },
    });
  }

  return (
    <Section
      title="Sobre a empresa"
      description="Dados cadastrais principais do cliente."
    >
      <Grid columns={2}>
        <Field
          label="Razão Social"
          required
          error={errors["sobreEmpresa.razaoSocial"]}
        >
          <TextInput
            value={s.razaoSocial}
            onChange={(e) => patch({ razaoSocial: e.target.value })}
          />
        </Field>

        <Field label="CNPJ" required error={errors["sobreEmpresa.cnpj"]}>
          <TextInput
            value={s.cnpj}
            onChange={(e) => patch({ cnpj: e.target.value })}
          />
        </Field>

        <Field
          label="Inscrição Estadual"
          required
          error={errors["sobreEmpresa.inscricaoEstadual"]}
        >
          <TextInput
            value={s.inscricaoEstadual}
            onChange={(e) => patch({ inscricaoEstadual: e.target.value })}
          />
        </Field>

        <Field label="Inscrição Municipal" hint="Campo opcional">
          <TextInput
            value={s.inscricaoMunicipal ?? ""}
            onChange={(e) => patch({ inscricaoMunicipal: e.target.value })}
          />
        </Field>

        <Field
          label="Endereço completo — escritório"
          required
          error={errors["sobreEmpresa.enderecoCompletoEscritorio"]}
        >
          <TextInput
            value={s.enderecoCompletoEscritorio}
            onChange={(e) =>
              patch({ enderecoCompletoEscritorio: e.target.value })
            }
          />
        </Field>

        <Field label="Endereço completo — armazém" hint="Campo opcional">
          <TextInput
            value={s.enderecoCompletoArmazem ?? ""}
            onChange={(e) =>
              patch({ enderecoCompletoArmazem: e.target.value })
            }
          />
        </Field>

        <Field label="CNAE secundário" hint="Campo opcional">
          <TextInput
            value={s.cnaeSecundario ?? ""}
            onChange={(e) => patch({ cnaeSecundario: e.target.value })}
          />
        </Field>

        <Field
          label="CNAE principal"
          required
          error={errors["sobreEmpresa.cnaePrincipal"]}
        >
          <TextInput
            value={s.cnaePrincipal}
            onChange={(e) => patch({ cnaePrincipal: e.target.value })}
          />
        </Field>

        <Field
          label="Regime de tributação"
          required
          error={errors["sobreEmpresa.regimeTributacao"]}
        >
          <Select
            value={s.regimeTributacao}
            onChange={(e) =>
              patch({ regimeTributacao: e.target.value as any })
            }
          >
            <option value="SIMPLES_NACIONAL">Simples Nacional</option>
            <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
            <option value="LUCRO_REAL">Lucro Real</option>
          </Select>
        </Field>

        <Field
          label="Responsável comercial"
          required
          error={errors["sobreEmpresa.responsavelComercial"]}
        >
          <Select
            value={s.responsavelComercial}
            onChange={(e) =>
              patch({ responsavelComercial: e.target.value as any })
            }
          >
            <option value="BRUNA_PARIZOTTO">Bruna Parizotto</option>
            <option value="BERNARDO">Bernardo</option>
            <option value="EVERTON">Everton</option>
            <option value="VINICIUS">Vinicius</option>
            <option value="KLEBER">Kleber</option>
          </Select>
        </Field>
      </Grid>
    </Section>
  );
}