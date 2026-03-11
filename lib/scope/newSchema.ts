import { z } from "zod";

const simNao = z.enum(["SIM", "NAO"]);
const contaPagamento = z.enum(["CASCO", "CLIENTE"]);
const regimeTributario = z.enum([
  "SIMPLES_NACIONAL",
  "LUCRO_PRESUMIDO",
  "LUCRO_REAL",
]);
const responsavelComercial = z.enum([
  "BRUNA_PARIZOTTO",
  "BERNARDO",
  "EVERTON",
  "VINICIUS",
  "KLEBER",
]);

const analistaDAImportacao = z.enum([
  "ANNA",
  "CLEVERSON",
  "MARCUS",
  "GILMARA",
  "THEILA",
]);

const analistaAEImportacao = z.enum([
  "KAROL",
  "LAYSA",
  "ANTONIO",
  "JONATHAN",
]);

const tipoOperacao = z.enum(["IMPORTACAO", "EXPORTACAO"]);
const dtcDta = z.enum(["DTC", "DTA", "NAO"]);
const integralBeneficio = z.enum(["INTEGRAL", "BENEFICIO"]);
const destinacao = z.enum(["CONSUMO", "REVENDA"]);
const subtipoConsumo = z.enum([
  "ATIVO_IMOBILIZADO_FIXO",
  "INSUMOS_PARA_INDUSTRIALIZACAO",
  "USO_E_CONSUMO",
]);

const anuenciaImportacao = z.enum([
  "ANVISA",
  "MAPA",
  "IBAMA",
  "DFPC",
  "DPF",
  "MARINHA_AERONAUTICA",
  "CTMSP_CNEN",
  "MDIC_SECEX",
  "BACEN",
  "RFB",
  "INMETRO",
  "CNPQ_MCTI",
  "ICMBIO",
  "ANP",
  "ANTT_ANTAQ_ANAC",
]);

const localEntradaImportacao = z.enum([
  "PARANAGUA_0917800",
  "CURITIBA_0917900",
  "SANTOS_0817800",
  "VIRACOPOS_0817700",
  "SALVADOR_0517800",
  "RIO_0717700",
  "SUAPE_0417902",
]);

const armazemLiberacaoImportacao = z.enum([
  "SANTOS_BANDEIRANTES_8931364",
  "SANTOS_MOVECTA_8933001",
  "SANTOS_MULTILOG_8933201",
  "SANTOS_EUDMARCO_8933202",
  "VCP_8921101",
  "GRU_8911101",
  "CLIF_9983001",
  "PORTONAVE_9101602",
  "MULTILOG_ITAJAI_9103201",
  "PACLOG_NAVEGANTES_9101102",
  "PACLOG_CURITIBA_9991102",
  "PS1_MULTILOG_CURITIBA_9993202",
  "TCP_PARANAGUA_9801303",
  "ROCHA_PARANAGUA_9801408",
  "TECON_SUAPE_4931303",
]);

const portoFronteiraExportacao = z.enum([
  "FOZ_DO_IGUACU",
  "URUGUAIANA",
  "JAGUARAO",
  "CHUI",
  "CORUMBA",
]);

const contaBancariaSchema = z.object({
  banco: z.string().min(1),
  agencia: z.string().min(1),
  conta: z.string().min(1),
});

const contatoSchema = z.object({
  nome: z.string().min(1),
  cargoDepartamento: z.string().min(1),
  email: z.string().email(),
  telefone: z.string().min(1),
});

const impostoBeneficioSchema = z.object({
  regime: integralBeneficio,
  detalheBeneficio: z.string().optional().nullable(),
}).superRefine((val, ctx) => {
  if (val.regime === "BENEFICIO" && !val.detalheBeneficio?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["detalheBeneficio"],
      message: "Detalhe do benefício é obrigatório",
    });
  }
});

const importacaoSchema = z.object({
  analistaDA: analistaDAImportacao,
  analistaAE: analistaAEImportacao,
  produtosImportados: z.string().min(1),
  ncms: z.array(z.string().min(1)).min(1),
  vinculoComExportador: simNao,

  locaisEntrada: z.array(localEntradaImportacao).default([]),
  outroLocalEntrada: z.string().optional().nullable(),

  armazensLiberacao: z.array(armazemLiberacaoImportacao).default([]),
  outroArmazemLiberacao: z.string().optional().nullable(),

  necessidadeDtcDta: dtcDta,

  necessidadeLiLpco: simNao,
  anuencias: z.array(anuenciaImportacao).default([]),

  impostosFederais: z.object({
    contaPagamento,
    dadosContaCliente: contaBancariaSchema.optional(),
    ii: impostoBeneficioSchema,
    ipi: impostoBeneficioSchema,
    pis: impostoBeneficioSchema,
    cofins: impostoBeneficioSchema,
  }),

  afrmm: z.object({
    contaPagamento,
    dadosContaCliente: contaBancariaSchema.optional(),
    regime: integralBeneficio,
    detalheBeneficio: z.string().optional().nullable(),
  }),

  icms: z.object({
    contaPagamento,
    dadosContaCliente: contaBancariaSchema.optional(),
    regime: integralBeneficio,
    recolhida: z.string().optional().nullable(),
    efetiva: z.string().optional().nullable(),
  }),

  destinacao: destinacao,
  subtipoConsumo: subtipoConsumo.optional().nullable(),
}).superRefine((val, ctx) => {
  if (val.locaisEntrada.length === 0 && !val.outroLocalEntrada?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["locaisEntrada"],
      message: "Selecione ao menos um local de entrada ou informe outro local",
    });
  }

  if (val.armazensLiberacao.length === 0 && !val.outroArmazemLiberacao?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["armazensLiberacao"],
      message: "Selecione ao menos um armazém de liberação ou informe outro",
    });
  }

  if (val.necessidadeLiLpco === "SIM" && val.anuencias.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["anuencias"],
      message: "Selecione ao menos uma anuência",
    });
  }

  if (val.impostosFederais.contaPagamento === "CLIENTE" && !val.impostosFederais.dadosContaCliente) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["impostosFederais", "dadosContaCliente"],
      message: "Dados da conta do cliente são obrigatórios",
    });
  }

  if (val.afrmm.contaPagamento === "CLIENTE" && !val.afrmm.dadosContaCliente) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["afrmm", "dadosContaCliente"],
      message: "Dados da conta do cliente são obrigatórios",
    });
  }

  if (val.afrmm.regime === "BENEFICIO" && !val.afrmm.detalheBeneficio?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["afrmm", "detalheBeneficio"],
      message: "Detalhe do benefício AFRMM é obrigatório",
    });
  }

  if (val.icms.contaPagamento === "CLIENTE" && !val.icms.dadosContaCliente) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["icms", "dadosContaCliente"],
      message: "Dados da conta do cliente são obrigatórios",
    });
  }

  if (val.icms.regime === "BENEFICIO") {
    if (!val.icms.recolhida?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["icms", "recolhida"],
        message: "Recolhida é obrigatória",
      });
    }
    if (!val.icms.efetiva?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["icms", "efetiva"],
        message: "Efetiva é obrigatória",
      });
    }
  }

  if (val.destinacao === "CONSUMO" && !val.subtipoConsumo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["subtipoConsumo"],
      message: "Subtipo de consumo é obrigatório",
    });
  }
});

const servicoValorOuSalarioSchema = z.object({
  habilitado: z.boolean(),
  tipoValor: z.enum(["SALARIO_MINIMO", "OUTRO"]).optional(),
  valor: z.number().optional().nullable(),
}).superRefine((val, ctx) => {
  if (val.habilitado) {
    if (!val.tipoValor) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["tipoValor"], message: "Tipo de valor é obrigatório" });
    }
    if (val.tipoValor === "OUTRO" && (val.valor == null || val.valor <= 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["valor"], message: "Valor é obrigatório" });
    }
  }
});

const servicoValorSimplesSchema = z.object({
  habilitado: z.boolean(),
  valor: z.number().optional().nullable(),
}).superRefine((val, ctx) => {
  if (val.habilitado && (val.valor == null || val.valor <= 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["valor"], message: "Valor é obrigatório" });
  }
});

const servicoPrepostoSchema = z.object({
  habilitado: z.boolean(),
  valor: z.number().optional().nullable(),
  inclusoNoDesembaracoCasco: simNao.optional(),
}).superRefine((val, ctx) => {
  if (val.habilitado) {
    if (val.valor == null || val.valor <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["valor"], message: "Valor é obrigatório" });
    }
    if (!val.inclusoNoDesembaracoCasco) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["inclusoNoDesembaracoCasco"],
        message: "Campo obrigatório",
      });
    }
  }
});

const servicoFreteInternacionalSchema = z.object({
  habilitado: z.boolean(),
  ptaxNegociado: z.string().optional().nullable(),
  percentual: z.number().optional().nullable(),
}).superRefine((val, ctx) => {
  if (val.habilitado) {
    if (!val.ptaxNegociado?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["ptaxNegociado"], message: "PTAX negociado é obrigatório" });
    }
    if (val.percentual == null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["percentual"], message: "Percentual é obrigatório" });
    }
  }
});

const servicoSeguroSchema = z.object({
  habilitado: z.boolean(),
  valorNegociado: z.number().optional().nullable(),
  descricaoComplementar: z.string().optional().nullable(),
}).superRefine((val, ctx) => {
  if (val.habilitado) {
    if (val.valorNegociado == null || val.valorNegociado <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["valorNegociado"], message: "Valor negociado é obrigatório" });
    }
    if (!val.descricaoComplementar?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["descricaoComplementar"],
        message: "Descrição complementar é obrigatória",
      });
    }
  }
});

const servicoFreteRodoviarioSchema = z.object({
  habilitado: z.boolean(),
  modalidade: z.enum(["SIM", "CASO_A_CASO"]).optional(),
}).superRefine((val, ctx) => {
  if (val.habilitado && !val.modalidade) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["modalidade"], message: "Modalidade é obrigatória" });
  }
});

const regimeEspecialItemSchema = z.object({
  observacao: z.string().min(1),
  valor: z.number().positive(),
});

const servicosImportacaoSchema = z.object({
  despachoAduaneiroImportacao: servicoValorOuSalarioSchema,
  preposto: servicoPrepostoSchema,
  emissaoLiLpco: servicoValorSimplesSchema,
  cadastroCatalogoProdutos: servicoValorSimplesSchema,
  assessoria: servicoValorOuSalarioSchema,
  freteInternacional: servicoFreteInternacionalSchema,
  seguroInternacional: servicoSeguroSchema,
  freteRodoviario: servicoFreteRodoviarioSchema,
  regimeEspecial: z.array(regimeEspecialItemSchema).default([]),
  emissaoNfe: servicoValorSimplesSchema,
});

const exportacaoSchema = z.object({
  analistaDA: z.string().min(1),
  analistaAE: z.string().min(1),
  produtosExportados: z.string().min(1),
  ncms: z.array(z.string().min(1)).min(1),
  portosFronteiras: z.array(portoFronteiraExportacao).default([]),
  outroPorto: z.string().optional().nullable(),
  outraFronteira: z.string().optional().nullable(),
}).superRefine((val, ctx) => {
  if (
    val.portosFronteiras.length === 0 &&
    !val.outroPorto?.trim() &&
    !val.outraFronteira?.trim()
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["portosFronteiras"],
      message: "Selecione ao menos um porto/fronteira ou informe um texto complementar",
    });
  }
});

const servicoOutrosCertificadosSchema = z.object({
  habilitado: z.boolean(),
  especificacaoCertificado: z.string().optional().nullable(),
  valor: z.number().optional().nullable(),
}).superRefine((val, ctx) => {
  if (val.habilitado) {
    if (!val.especificacaoCertificado?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["especificacaoCertificado"],
        message: "Especificação do certificado é obrigatória",
      });
    }
    if (val.valor == null || val.valor <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valor"],
        message: "Valor é obrigatório",
      });
    }
  }
});

const servicosExportacaoSchema = z.object({
  despachoAduaneiroExportacao: servicoValorOuSalarioSchema,
  preposto: servicoPrepostoSchema,
  certificadoOrigem: servicoValorSimplesSchema,
  certificadoFitossanitario: servicoValorSimplesSchema,
  outrosCertificados: servicoOutrosCertificadosSchema,
  assessoria: servicoValorOuSalarioSchema,
  freteInternacional: servicoFreteInternacionalSchema,
  seguroInternacional: servicoSeguroSchema,
  freteRodoviario: servicoFreteRodoviarioSchema,
  regimeEspecial: z.array(regimeEspecialItemSchema).default([]),
});

export const escopoSchema = z.object({
  informacoesFixas: z.object({
    salarioMinimoVigente: z.number().positive(),
    dadosBancariosCasco: contaBancariaSchema,
  }),

  sobreEmpresa: z.object({
    razaoSocial: z.string().min(1),
    cnpj: z.string().min(14),
    inscricaoEstadual: z.string().min(1),
    inscricaoMunicipal: z.string().optional().nullable(),
    enderecoCompletoEscritorio: z.string().min(1),
    enderecoCompletoArmazem: z.string().min(1),
    cnaePrincipal: z.string().min(1),
    regimeTributacao,
    responsavelComercial,
  }),

  contatos: z.array(contatoSchema).min(1),

  operacao: z.object({
    tipos: z.array(tipoOperacao).min(1),
    importacao: importacaoSchema.optional(),
    exportacao: exportacaoSchema.optional(),
  }),

  servicos: z.object({
    importacao: servicosImportacaoSchema.optional(),
    exportacao: servicosExportacaoSchema.optional(),
  }),

  financeiro: z.object({
    dadosBancariosClienteDevolucaoSaldo: contaBancariaSchema,
    observacoesFinanceiro: z.string().min(1),
  }),
}).superRefine((val, ctx) => {
  const temImportacao = val.operacao.tipos.includes("IMPORTACAO");
  const temExportacao = val.operacao.tipos.includes("EXPORTACAO");

  if (temImportacao && !val.operacao.importacao) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["operacao", "importacao"],
      message: "Bloco de importação é obrigatório",
    });
  }

  if (temImportacao && !val.servicos.importacao) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["servicos", "importacao"],
      message: "Serviços de importação são obrigatórios",
    });
  }

  if (temExportacao && !val.operacao.exportacao) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["operacao", "exportacao"],
      message: "Bloco de exportação é obrigatório",
    });
  }

  if (temExportacao && !val.servicos.exportacao) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["servicos", "exportacao"],
      message: "Serviços de exportação são obrigatórios",
    });
  }
});

export type EscopoForm = z.infer<typeof escopoSchema>;