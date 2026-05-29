# Migração do formulário de escopo (modelo antigo -> canônico)

## Operation IMPORT / EXPORT
- `operations.<importOperation|exportOperation>.ncms[]` agora inclui:
  - `code`
  - `hasBenefit` (boolean|null)
  - `benefitDescription` (string|null)
- `operations.<importOperation|exportOperation>.ncmNotes` mantém observações em texto livre.

## Operation IMPORT
- `operations.importOperation.entryLocations[]` e `customsClearanceLocations[]` devem receber itens estruturados com:
  - `type` (`ENTRY`/`CUSTOMS_CLEARANCE`)
  - `rawValue` (valor original selecionado)
  - `code` (quando houver código antes de `|`)
  - `name`
- `operations.importOperation.destinationPurposes[]` continua estruturado por destinação.
- Para a destinação de consumo do modelo antigo (`CONSUMO`), usar o valor canônico `CONSUMPTION` em `purpose`.
- Quando `purpose = CONSUMPTION`, a API deve persistir `consumptionSubtypes[]` com uma ou mais opções:
  - `ATIVO_IMOBILIZADO_FIXO`
  - `INSUMOS_PARA_INDUSTRIALIZACAO`
  - `USO_E_CONSUMO`
- `consumptionSubtype` permanece como campo legado/compatibilidade simples, mas o novo formulário envia a lista em `consumptionSubtypes[]`.

## TAXES / ICMS
- `taxes.importTaxes.icms.destinationRates[]` passa a aceitar também:
  - `regime` (por destinação)
  - `effectiveRate`
  - `collectedRate`
  - `notes`
- O novo valor de destinação `CONSUMPTION` também pode aparecer em `destinationRates[].destinationPurpose`.

## Compatibilidade com modelo antigo
- Modelo antigo (`StepImportacao`/`StepExportacao`) tinha `ncms[].possuiBeneficio` / `descricaoBeneficio`; no canônico usar `hasBenefit` / `benefitDescription`.
- Locais antes eram strings selecionadas; agora devem ser persistidos como objetos de localização.
- Subtipos de consumo antes estavam em `subtipoConsumo`; agora devem alimentar `destinationPurposes[].consumptionSubtypes` no item `CONSUMPTION`.
