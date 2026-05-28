# Migração do formulário de escopo (modelo antigo -> canônico)

## Operation IMPORT
- `operations.importOperation.ncms[]` agora inclui:
  - `code`
  - `hasBenefit` (boolean|null)
  - `benefitDescription` (string|null)
- `operations.importOperation.ncmNotes` mantém observações em texto livre.
- `operations.importOperation.entryLocations[]` e `customsClearanceLocations[]` devem receber itens estruturados com:
  - `type` (`ENTRY`/`CUSTOMS_CLEARANCE`)
  - `rawValue` (valor original)
  - `code` (quando houver)
  - `name`
- `operations.importOperation.destinationPurposes[]` continua com `purpose` e `consumptionSubtype` para `USE_AND_CONSUMPTION`.

## TAXES / ICMS
- `taxes.importTaxes.icms.destinationRates[]` passa a aceitar também:
  - `regime` (por destinação)
  - `effectiveRate`
  - `collectedRate`
  - `notes`

## Compatibilidade com modelo antigo
- Modelo antigo (StepImportacao) tinha `ncms[].possuiBeneficio` / `descricaoBeneficio`; no canônico usar `hasBenefit` / `benefitDescription`.
- Locais antes eram strings selecionadas; agora devem ser persistidos como objetos de localização.
- Subtipo de consumo continua condicionado à seleção de destinação de uso/consumo.
