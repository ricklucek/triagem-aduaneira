import axios from 'axios';

export const isCPF = (value: string) => {
  const cpfRegex = /^\d{3}\.\d{3}\.\d{3}\-\d{2}$|^\d{11}$/;
  return cpfRegex.test(value);
};

export const isCNPJ = (value: string) => {
  const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/;
  return cnpjRegex.test(value);
};

export async function copyToClipboard(item: string) {
  await navigator.clipboard.writeText(item);
}

export function getIniciais(nomeCompleto: string) {
  if (!nomeCompleto || typeof nomeCompleto !== 'string') {
    return '';
  }

  // Remove espaços extras no início, meio e fim
  const nomeLimpo = nomeCompleto.trim().replace(/\s+/g, ' ');

  if (nomeLimpo === '') {
    return '';
  }

  const partes = nomeLimpo.split(' ');

  // Se tiver apenas um nome, pega só a inicial dele
  if (partes.length === 1) {
    return partes[0][0].toUpperCase();
  }

  const primeiraInicial = partes[0][0].toUpperCase();
  const ultimaInicial = partes[partes.length - 1][0].toUpperCase();

  return primeiraInicial + ultimaInicial;
}


export const text = (v: unknown) =>
  v == null || v === "" || (Array.isArray(v) && v.length === 0)
    ? null
    : String(v);

export const bool = (v?: boolean | null) => {
  if (v == null) return null;
  return v ? "Sim" : "Não";
};

export const currency = (v?: string | number | null) => {
  if (v == null || v === "") return null;

  const numberValue = typeof v === "string" ? Number(v) : v;

  if (Number.isNaN(numberValue)) return null;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numberValue);
};

export const percent = (v?: string | number | null) => {
  if (v == null || v === "") return null;

  const numberValue = typeof v === "string" ? Number(v) : v;

  if (Number.isNaN(numberValue)) return null;

  return `${numberValue.toLocaleString("pt-BR")}%`;
};

export const date = (v?: string | null) => {
  if (!v) return null;

  const onlyDate = v.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(onlyDate);

  if (!match) return v;

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
};

export const list = (v?: Array<string | number | null | undefined> | null) =>
  !v?.length ? null : v.filter(Boolean).join(", ");

export const label = (dictionary: Record<string, string>, value?: string | null) => {
  if (!value) return null;
  return dictionary[value] ?? value;
};


export const accountCasco = (
  v?: {
    banco?: string | null;
    agencia?: string | null;
    conta?: string | null;
    bankName?: string | null;
    bankBranch?: string | null;
    bankAccount?: string | null;
    branch?: string | null;
    account?: string | null;
  } | null,
) => {
  if (!v) return null;

  const bankName = v.banco ?? v.bankName;
  const branch = v.agencia ?? v.bankBranch ?? v.branch;
  const account = v.conta ?? v.bankAccount ?? v.account;

  if (!bankName && !branch && !account) return null;

  return `Banco: ${text(bankName) ?? "-"} • Agência: ${
    text(branch) ?? "-"
  } • Conta: ${text(account) ?? "-"}`;
};

export const taxAccount = (
  v?: {
    bankName?: string | null;
    bankBranch?: string | null;
    bankAccount?: string | null;
  } | null,
) =>
  !v || (!v.bankName && !v.bankBranch && !v.bankAccount)
    ? null
    : `Banco: ${text(v.bankName) ?? "-"} • Agência: ${
        text(v.bankBranch) ?? "-"
      } • Conta: ${text(v.bankAccount) ?? "-"}`;

export const refundAccount = (
  v?: {
    bankName?: string | null;
    branch?: string | null;
    account?: string | null;
  } | null,
) =>
  !v || (!v.bankName && !v.branch && !v.account)
    ? null
    : `Banco: ${text(v.bankName) ?? "-"} • Agência: ${
        text(v.branch) ?? "-"
      } • Conta: ${text(v.account) ?? "-"}`;
