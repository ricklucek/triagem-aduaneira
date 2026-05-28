"use client";

import { useEffect, useRef, useState } from "react";

import type { EscopoForm } from "@/domain/scope/types";

import type { ScopeResponsible } from "@/lib/api/types/scope-metadata";

import { Field, Select, TextArea, TextInput } from "@/components/ui/form-fields";
import { Card, Grid, Stack } from "@/components/ui/form-layout";

import { publicApi } from "@/lib/api/services/public";
import UserSelect from "./blocks/UserSelect";


function fieldError(errors: Record<string, string>, ...paths: string[]) {
  for (const path of paths) {
    if (errors[path]) return errors[path];
  }
  return undefined;
}

export default function CompanyStep({
  form,
  patchForm,
  errors,
  responsaveis,
}: {
  form: EscopoForm;
  patchForm: (patch: Partial<EscopoForm>) => void;
  errors: Record<string, string>;
  responsaveis: ScopeResponsible[];
}) {
  const company = form.company;
  const assignments = form.assignments;

  function patchCompany(patch: any) {
    patchForm({ company: { ...company, ...patch } } as Partial<EscopoForm>);
  }

  function patchAssignments(patch: any) {
    patchForm({ assignments: { ...assignments, ...patch } } as Partial<EscopoForm>);
  }

  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const lastFetchedRef = useRef<string>("");

  useEffect(() => {
    async function lookup() {
      const taxId = company.taxId?.replace(/\D/g, "") ?? "";

      if (taxId.length !== 14 || lastFetchedRef.current === taxId) return;

      setLoadingCnpj(true);
      setLookupError(null);

      try {
        const data = await publicApi.lookupCompanyByCnpj(taxId);

        lastFetchedRef.current = taxId;

        const officeAddress = [
          data.logradouro,
          data.bairro,
          data.numero ? `n°${data.numero}` : null,
          data.municipio && data.uf ? `${data.municipio}/${data.uf}` : null,
          data.cep ? `CEP: ${data.cep}` : null,
        ]
          .filter(Boolean)
          .join(" - ");

        patchCompany({
          ...form.company,
          taxId,
          legalName: data.razao_social ?? form.company.legalName,
          tradeName: data.nome_fantasia ?? form.company.tradeName,
          stateRegistration:
            data.inscricaoEstadual ?? form.company.stateRegistration,
          municipalRegistration:
            data.inscricaoMunicipal ?? form.company.municipalRegistration,
          officeAddress: officeAddress || form.company.officeAddress,
          warehouseAddress: form.company.warehouseAddress,
          mainCnae: data.cnae_fiscal_descricao ?? form.company.mainCnae,
          secondaryCnae:
            data.cnaes_secundarios?.map((c) => `${c.codigo} - ${c.descricao}`).join("\n") ??
            form.company.secondaryCnae,
          taxRegime: data.regimeTributacao ?? form.company.taxRegime,
          radarMode: form.company.radarMode,
        });
      } catch {
        setLookupError(
          "Não foi possível consultar os dados públicos do CNPJ agora.",
        );
      } finally {
        setLoadingCnpj(false);
      }
    }

    void lookup();
  }, [company.taxId]);

  return (
    <Stack>
      <Card>
        <h3 className="text-base font-semibold">Sobre a empresa</h3>
        <Grid columns={2}>
          <Field label="CNPJ" required error={fieldError(errors, "company.taxId")}
            hint={
              loadingCnpj
                ? "Consultando Receita Federal..."
                : (lookupError ??
                  "Ao concluir 14 dígitos, os dados serão buscados automaticamente.")
            }
          >
            <TextInput value={company.taxId ?? ""} onChange={(e) => patchCompany({ taxId: e.target.value.replace(/\D/g, "") })} />
          </Field>
          <Field label="Razão social" required error={fieldError(errors, "company.legalName")}>
            <TextInput value={company.legalName ?? ""} onChange={(e) => patchCompany({ legalName: e.target.value })} />
          </Field>
          <Field label="Nome Resumido">
            <TextInput value={company.tradeName ?? ""} onChange={(e) => patchCompany({ tradeName: e.target.value })} />
          </Field>
          <Field label="Inscrição estadual">
            <TextInput value={company.stateRegistration ?? ""} onChange={(e) => patchCompany({ stateRegistration: e.target.value })} />
          </Field>
          <Field label="Inscrição municipal">
            <TextInput value={company.municipalRegistration ?? ""} onChange={(e) => patchCompany({ municipalRegistration: e.target.value })} />
          </Field>
          <Field label="Regime de tributação" required error={fieldError(errors, "company.taxRegime")}>
            <Select value={company.taxRegime ?? ""} onChange={(e) => patchCompany({ taxRegime: e.target.value })}>
              <option value="">Selecione</option>
              <option value="SIMPLES_NACIONAL">Simples Nacional</option>
              <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
              <option value="LUCRO_REAL">Lucro Real</option>
              <option value="LUCRO_PRESUMIDO_OU_REAL">Lucro Presumido ou Real</option>
            </Select>
          </Field>
          <Field label="Modalidade RADAR" required error={fieldError(errors, "company.radarMode")}>
            <Select value={company.radarMode ?? ""} onChange={(e) => patchCompany({ radarMode: e.target.value })}>
              <option value="">Selecione</option>
              <option value="RADAR_INATIVO">Radar inativo</option>
              <option value="RADAR_LIMITADO_50K">Limitado 50k</option>
              <option value="RADAR_LIMITADO_150K">Limitado 150k</option>
              <option value="RADAR_ILIMITADO">Ilimitado</option>
            </Select>
          </Field>
          <Field label="CNAE principal" required error={fieldError(errors, "company.mainCnae")}>
            <TextInput value={company.mainCnae ?? ""} onChange={(e) => patchCompany({ mainCnae: e.target.value })} />
          </Field>
          <Field label="CNAEs secundários">
            <TextArea value={company.secondaryCnae ?? ""} onChange={(e) => patchCompany({ secondaryCnae: e.target.value })} />
          </Field>
          <Field label="Endereço do escritório" required error={fieldError(errors, "company.officeAddress")}>
            <TextArea value={company.officeAddress ?? ""} onChange={(e) => patchCompany({ officeAddress: e.target.value })} />
          </Field>
          <Field label="Endereço do armazém">
            <TextArea value={company.warehouseAddress ?? ""} onChange={(e) => patchCompany({ warehouseAddress: e.target.value })} />
          </Field>
        </Grid>
      </Card>

      <Card>
        <h3 className="text-base font-semibold">Responsável comercial</h3>
        <UserSelect
          label="Responsável comercial"
          value={assignments.commercialResponsibleId ?? ""}
          onChange={(value) => patchAssignments({ commercialResponsibleId: value })}
          options={responsaveis}
          error={fieldError(errors, "assignments.commercialResponsibleId")}
        />
      </Card>
    </Stack>
  );
}