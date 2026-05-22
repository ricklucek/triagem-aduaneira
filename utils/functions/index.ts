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
