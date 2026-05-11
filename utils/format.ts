export function formatCNPJ(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export const isCNPJ = (value: string) => {
  const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/;
  return cnpjRegex.test(value);
};

export function formatNCM(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  return digits.replace(/^(\d{4})(\d{2})(\d{2})/, "$1.$2.$3");
}