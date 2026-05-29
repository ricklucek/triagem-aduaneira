"use client";

import type { EscopoForm } from "@/domain/scope/types";
import type { OperationDraft, TaxesDraft } from "@/domain/scope/schema";

import { Field, NumberInput, Select, TextInput } from "@/components/ui/form-fields";
import { Card, Grid, Stack } from "@/components/ui/form-layout";

import {
  DESTINATION_LABEL,
  OPERATION_LABEL,
  TAX_REGIME_LABEL,
  emptyOperationTaxes,
  type OperationType,
} from "./canonical-draft";

type OperationTaxes = NonNullable<TaxesDraft["importTaxes"]>;
type FederalTaxes = NonNullable<OperationTaxes["federalTaxes"]>;
type AfrmmTaxes = NonNullable<OperationTaxes["afrmm"]>;
type IcmsTaxes = NonNullable<OperationTaxes["icms"]>;
type IcmsDestinationRate = IcmsTaxes["destinationRates"][number];
type TaxRegime = NonNullable<FederalTaxes["iiRegime"]>;
type AccountOwner = FederalTaxes["paymentAccountType"];

type TaxesStepProps = {
  form: EscopoForm;
  patchForm: (patch: Partial<EscopoForm>) => void;
  errors: Record<string, string>;
};

function AccountOwnerSelect({
  value,
  onChange,
}: {
  value?: AccountOwner | null;
  onChange: (value: AccountOwner) => void;
}) {
  return (
    <Select value={value ?? "CASCO"} onChange={(event) => onChange(event.target.value as AccountOwner)}>
      <option value="CASCO">Conta CASCO</option>
      <option value="CLIENT">Conta do cliente</option>
    </Select>
  );
}

function TaxRegimeSelect({
  value,
  onChange,
}: {
  value?: TaxRegime | null;
  onChange: (value: TaxRegime) => void;
}) {
  return (
    <Select value={value ?? "FULL"} onChange={(event) => onChange(event.target.value as TaxRegime)}>
      {Object.entries(TAX_REGIME_LABEL).map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </Select>
  );
}

const federalTaxFields: Array<{
  label: string;
  regimeKey: "iiRegime" | "ipiRegime" | "pisRegime" | "cofinsRegime";
  benefitKey: "iiBenefitDetail" | "ipiBenefitDetail" | "pisBenefitDetail" | "cofinsBenefitDetail";
}> = [
  { label: "II", regimeKey: "iiRegime", benefitKey: "iiBenefitDetail" },
  { label: "IPI", regimeKey: "ipiRegime", benefitKey: "ipiBenefitDetail" },
  { label: "PIS", regimeKey: "pisRegime", benefitKey: "pisBenefitDetail" },
  { label: "COFINS", regimeKey: "cofinsRegime", benefitKey: "cofinsBenefitDetail" },
];

export default function TaxesStep({ form, patchForm }: TaxesStepProps) {
  const tabs = form.operations.types.length ? form.operations.types : ["IMPORT"];
  const defaultTaxes = emptyOperationTaxes() as OperationTaxes;

  return (
    <Stack>
      {tabs.map((operationType) => {
        const key: keyof TaxesDraft = operationType === "IMPORT" ? "importTaxes" : "exportTaxes";
        const taxes = (form.taxes[key] ?? defaultTaxes) as OperationTaxes;
        const federal = (taxes.federalTaxes ?? defaultTaxes.federalTaxes) as FederalTaxes;
        const afrmm = (taxes.afrmm ?? defaultTaxes.afrmm) as AfrmmTaxes;
        const icms = (taxes.icms ?? defaultTaxes.icms) as IcmsTaxes;
        const operation = (operationType === "IMPORT"
          ? form.operations.importOperation
          : form.operations.exportOperation) as OperationDraft | null;
        const destinations = operation?.destinationPurposes ?? [];

        function patchTaxes(patch: Partial<OperationTaxes>) {
          patchForm({
            taxes: {
              ...form.taxes,
              [key]: { ...taxes, ...patch },
            },
          } as Partial<EscopoForm>);
        }

        function patchFederal(patch: Partial<FederalTaxes>) {
          patchTaxes({ federalTaxes: { ...federal, ...patch } as FederalTaxes });
        }

        function patchAfrmm(patch: Partial<AfrmmTaxes>) {
          patchTaxes({ afrmm: { ...afrmm, ...patch } as AfrmmTaxes });
        }

        function patchIcms(patch: Partial<IcmsTaxes>) {
          patchTaxes({ icms: { ...icms, ...patch } as IcmsTaxes });
        }

        function updateDestinationRate(destinationPurpose: IcmsDestinationRate["destinationPurpose"], patch: Partial<IcmsDestinationRate>) {
          const currentRate = icms.destinationRates.find((rate) => rate.destinationPurpose === destinationPurpose) ?? {
            destinationPurpose,
            collectedRate: null,
            effectiveRate: null,
            regime: icms.regime,
            notes: null,
          };
          const nextRates = [
            ...icms.destinationRates.filter((rate) => rate.destinationPurpose !== destinationPurpose),
            { ...currentRate, ...patch },
          ];

          patchIcms({ destinationRates: nextRates });
        }

        return (
          <Card key={operationType}>
            <h3 className="text-base font-semibold">
              Impostos - {OPERATION_LABEL[operationType as OperationType]}
            </h3>

            <div className="grid gap-5">
              <section className="grid gap-3">
                <h4 className="text-sm font-semibold">Impostos federais</h4>
                <Grid columns={2}>
                  <Field label="Conta impostos federais">
                    <AccountOwnerSelect
                      value={federal.paymentAccountType}
                      onChange={(paymentAccountType) => patchFederal({ paymentAccountType })}
                    />
                  </Field>
                  <Field label="Observação impostos federais">
                    <TextInput
                      value={federal.notes ?? ""}
                      onChange={(event) => patchFederal({ notes: event.target.value })}
                    />
                  </Field>
                </Grid>

                <Grid columns={2}>
                  {federalTaxFields.map((field) => (
                    <Card key={field.label} className="gap-3 p-3">
                      <Field label={field.label}>
                        <TaxRegimeSelect
                          value={federal[field.regimeKey]}
                          onChange={(value) => patchFederal({ [field.regimeKey]: value } as Partial<FederalTaxes>)}
                        />
                      </Field>
                      <Field label={`Benefício ${field.label}`}>
                        <TextInput
                          value={federal[field.benefitKey] ?? ""}
                          onChange={(event) =>
                            patchFederal({ [field.benefitKey]: event.target.value } as Partial<FederalTaxes>)
                          }
                        />
                      </Field>
                    </Card>
                  ))}
                </Grid>
              </section>

              {operationType === "IMPORT" ? (
                <section className="grid gap-3">
                  <h4 className="text-sm font-semibold">AFRMM</h4>
                  <Grid columns={2}>
                    <Field label="Conta AFRMM">
                      <AccountOwnerSelect
                        value={afrmm.paymentAccountType}
                        onChange={(paymentAccountType) => patchAfrmm({ paymentAccountType })}
                      />
                    </Field>
                    <Field label="Regime AFRMM">
                      <TaxRegimeSelect value={afrmm.regime} onChange={(regime) => patchAfrmm({ regime })} />
                    </Field>
                    <Field label="Detalhe benefício AFRMM">
                      <TextInput
                        value={afrmm.benefitDetail ?? ""}
                        onChange={(event) => patchAfrmm({ benefitDetail: event.target.value })}
                      />
                    </Field>
                    <Field label="Observação AFRMM">
                      <TextInput
                        value={afrmm.notes ?? ""}
                        onChange={(event) => patchAfrmm({ notes: event.target.value })}
                      />
                    </Field>
                  </Grid>
                </section>
              ) : null}

              <section className="grid gap-3">
                <h4 className="text-sm font-semibold">ICMS</h4>
                <Grid columns={2}>
                  <Field label="Conta ICMS">
                    <AccountOwnerSelect
                      value={icms.paymentAccountType}
                      onChange={(paymentAccountType) => patchIcms({ paymentAccountType })}
                    />
                  </Field>
                  <Field label="Regime ICMS">
                    <TaxRegimeSelect value={icms.regime} onChange={(regime) => patchIcms({ regime })} />
                  </Field>
                  <Field label="Alíquota efetiva padrão">
                    <NumberInput
                      value={icms.effectiveRate ?? ""}
                      onChange={(event) => patchIcms({ effectiveRate: event.target.value })}
                    />
                  </Field>
                  <Field label="Alíquota recolhida padrão">
                    <NumberInput
                      value={icms.collectedRate ?? ""}
                      onChange={(event) => patchIcms({ collectedRate: event.target.value })}
                    />
                  </Field>
                  <Field label="Observação ICMS">
                    <TextInput value={icms.notes ?? ""} onChange={(event) => patchIcms({ notes: event.target.value })} />
                  </Field>
                </Grid>

                {operationType === "IMPORT" && destinations.length > 0 ? (
                  <div className="grid gap-3">
                    {destinations.map((destination) => {
                      const rate = icms.destinationRates.find(
                        (destinationRate) => destinationRate.destinationPurpose === destination.purpose,
                      ) ?? {
                        destinationPurpose: destination.purpose,
                        collectedRate: null,
                        effectiveRate: null,
                        regime: icms.regime,
                        notes: null,
                      };

                      return (
                        <Card key={destination.purpose} className="gap-3 p-3">
                          <h5 className="text-sm font-semibold">{DESTINATION_LABEL[destination.purpose]}</h5>
                          <Grid columns={3}>
                            <Field label="Regime">
                              <TaxRegimeSelect
                                value={rate.regime}
                                onChange={(regime) => updateDestinationRate(destination.purpose, { regime })}
                              />
                            </Field>
                            <Field label="Alíquota efetiva">
                              <NumberInput
                                value={rate.effectiveRate ?? ""}
                                onChange={(event) =>
                                  updateDestinationRate(destination.purpose, { effectiveRate: event.target.value })
                                }
                              />
                            </Field>
                            <Field label="Alíquota recolhida">
                              <NumberInput
                                value={rate.collectedRate ?? ""}
                                onChange={(event) =>
                                  updateDestinationRate(destination.purpose, { collectedRate: event.target.value })
                                }
                              />
                            </Field>
                          </Grid>
                          <Field label="Observação">
                            <TextInput
                              value={rate.notes ?? ""}
                              onChange={(event) => updateDestinationRate(destination.purpose, { notes: event.target.value })}
                            />
                          </Field>
                        </Card>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            </div>
          </Card>
        );
      })}
    </Stack>
  );
}
