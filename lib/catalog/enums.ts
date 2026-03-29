export const OperationType = ["IMPORTACAO", "EXPORTACAO"] as const;
export const ModalType = ["MARITIMO", "AEREO", "RODOVIARIO"] as const;
export const TaxRegime = ["SIMPLES", "LUCRO_REAL", "LUCRO_PRESUMIDO"] as const;
export const Currency = ["BRL", "USD", "EUR"] as const;

export type OperationTypeT = (typeof OperationType)[number];
export type ModalTypeT = (typeof ModalType)[number];
export type TaxRegimeT = (typeof TaxRegime)[number];
export type CurrencyT = (typeof Currency)[number];
