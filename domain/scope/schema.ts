import { z } from "zod";

export const SimNaoSchema = z.enum(["SIM", "NAO"]);
export const ContaPagamentoSchema = z.enum(["CASCO", "CLIENTE"]);
export const IntegralBeneficioSchema = z.enum(["INTEGRAL", "BENEFICIO"]);

export const RegimeTributacaoSchema = z.enum([
  "SIMPLES_NACIONAL",
  "LUCRO_PRESUMIDO",
  "LUCRO_REAL",
]);

export const ResponsavelComercialSchema = z.enum([
  "BRUNA_PARIZOTTO",
  "BERNARDO",
  "EVERTON",
  "VINICIUS",
  "KLEBER",
]);

export const TipoOperacaoSchema = z.enum(["IMPORTACAO", "EXPORTACAO"]);

export const AnalistaDAImportacaoSchema = z.enum([
  "ANNA",
  "CLEVERSON",
  "MARCUS",
  "GILMARA",
  "THEILA",
]);

export const AnalistaAEImportacaoSchema = z.enum([
  "KAROL",
  "LAYSA",
  "ANTONIO",
  "JONATHAN",
]);

export const DtcDtaSchema = z.enum(["DTC", "DTA", "NAO"]);

export const AnuenciaImportacaoSchema = z.enum([
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

export const LocalEntradaImportacaoSchema = z.enum([
  "PARANAGUA_0917800",
  "CURITIBA_0917900",
  "SANTOS_0817800",
  "VIRACOPOS_0817700",
  "SALVADOR_0517800",
  "RIO_0717700",
  "SUAPE_0417902",
]);

export const ArmazemLiberacaoImportacaoSchema = z.enum([
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

export const DestinacaoSchema = z.enum(["CONSUMO", "REVENDA"]);
export const SubtipoConsumoSchema = z.enum([
  "ATIVO_IMOBILIZADO_FIXO",
  "INSUMOS_PARA_INDUSTRIALIZACAO",
  "USO_E_CONSUMO",
]);

export const PortoFronteiraExportacaoSchema = z.enum([
  "FOZ_DO_IGUACU",
  "URUGUAIANA",
  "JAGUARAO",
  "CHUI",
  "CORUMBA",
]);

export const ContaBancariaSchema = z.object({
  banco: z.string().trim().min(1, "Banco é obrigatório"),
  agencia: z.string().trim().min(1, "Agência é obrigatória"),
  conta: z.string().trim().min(1, "Conta é obrigatória"),
});

export const ContatoSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
  cargoDepartamento: z.string().trim().min(1, "Cargo/Departamento é obrigatório"),
  email: z.string().trim().email("E-mail inválido"),
  telefone: z.string().trim().min(1, "Telefone é obrigatório"),
});

const BeneficioTributoSchema = z
  .object({
    regime: IntegralBeneficioSchema,
    detalheBeneficio: z.string().trim().optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.regime === "BENEFICIO" && !value.detalheBeneficio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["detalheBeneficio"],
        message: "Detalhe do benefício é obrigatório",
      });
    }
  });

export const ImportacaoSchema = z
  .object({
    analistaDA: AnalistaDAImportacaoSchema,
    analistaAE: AnalistaAEImportacaoSchema,
    produtosImportados: z.string().trim().min(1, "Produtos importados é obrigatório"),
    ncms: z.array(z.string().trim().min(1)).min(1, "Informe ao menos 1 NCM"),
    vinculoComExportador: SimNaoSchema,

    locaisEntrada: z.array(LocalEntradaImportacaoSchema).default([]),
    outroLocalEntrada: z.string().trim().optional().nullable(),

    armazensLiberacao: z.array(ArmazemLiberacaoImportacaoSchema).default([]),
    outroArmazemLiberacao: z.string().trim().optional().nullable(),

    necessidadeDtcDta: DtcDtaSchema,

    necessidadeLiLpco: SimNaoSchema,
    anuencias: z.array(AnuenciaImportacaoSchema).default([]),

    impostosFederais: z.object({
      contaPagamento: ContaPagamentoSchema,
      dadosContaCliente: ContaBancariaSchema.optional(),
      ii: BeneficioTributoSchema,
      ipi: BeneficioTributoSchema,
      pis: BeneficioTributoSchema,
      cofins: BeneficioTributoSchema,
    }),

    afrmm: z.object({
      contaPagamento: ContaPagamentoSchema,
      dadosContaCliente: ContaBancariaSchema.optional(),
      regime: IntegralBeneficioSchema,
      detalheBeneficio: z.string().trim().optional().nullable(),
    }),

    icms: z.object({
      contaPagamento: ContaPagamentoSchema,
      dadosContaCliente: ContaBancariaSchema.optional(),
      regime: IntegralBeneficioSchema,
      recolhida: z.string().trim().optional().nullable(),
      efetiva: z.string().trim().optional().nullable(),
    }),

    destinacao: DestinacaoSchema,
    subtipoConsumo: SubtipoConsumoSchema.optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.locaisEntrada.length === 0 && !value.outroLocalEntrada) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["locaisEntrada"],
        message: "Selecione ao menos um local de entrada ou informe outro local",
      });
    }

    if (value.armazensLiberacao.length === 0 && !value.outroArmazemLiberacao) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["armazensLiberacao"],
        message: "Selecione ao menos um armazém de liberação ou informe outro",
      });
    }

    if (value.necessidadeLiLpco === "SIM" && value.anuencias.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["anuencias"],
        message: "Selecione ao menos uma anuência",
      });
    }

    if (
      value.impostosFederais.contaPagamento === "CLIENTE" &&
      !value.impostosFederais.dadosContaCliente
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["impostosFederais", "dadosContaCliente"],
        message: "Dados da conta do cliente são obrigatórios",
      });
    }

    if (value.afrmm.contaPagamento === "CLIENTE" && !value.afrmm.dadosContaCliente) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["afrmm", "dadosContaCliente"],
        message: "Dados da conta do cliente são obrigatórios",
      });
    }

    if (value.afrmm.regime === "BENEFICIO" && !value.afrmm.detalheBeneficio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["afrmm", "detalheBeneficio"],
        message: "Detalhe do benefício AFRMM é obrigatório",
      });
    }

    if (value.icms.contaPagamento === "CLIENTE" && !value.icms.dadosContaCliente) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["icms", "dadosContaCliente"],
        message: "Dados da conta do cliente são obrigatórios",
      });
    }

    if (value.icms.regime === "BENEFICIO") {
      if (!value.icms.recolhida) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["icms", "recolhida"],
          message: "Recolhida é obrigatória",
        });
      }
      if (!value.icms.efetiva) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["icms", "efetiva"],
          message: "Efetiva é obrigatória",
        });
      }
    }

    if (value.destinacao === "CONSUMO" && !value.subtipoConsumo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["subtipoConsumo"],
        message: "Subtipo de consumo é obrigatório",
      });
    }
  });

export const ExportacaoSchema = z
  .object({
    analistaDA: z.string().trim().min(1, "Analista DA é obrigatório"),
    analistaAE: z.string().trim().min(1, "Analista AE é obrigatório"),
    produtosExportados: z.string().trim().min(1, "Produtos exportados é obrigatório"),
    ncms: z.array(z.string().trim().min(1)).min(1, "Informe ao menos 1 NCM"),
    portosFronteiras: z.array(PortoFronteiraExportacaoSchema).default([]),
    outroPorto: z.string().trim().optional().nullable(),
    outraFronteira: z.string().trim().optional().nullable(),
    destinacao: DestinacaoSchema,
    subtipoConsumo: SubtipoConsumoSchema.optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (
      value.portosFronteiras.length === 0 &&
      !value.outroPorto &&
      !value.outraFronteira
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["portosFronteiras"],
        message: "Selecione ao menos um porto/fronteira ou informe um complemento",
      });
    }

    if (value.destinacao === "CONSUMO" && !value.subtipoConsumo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["subtipoConsumo"],
        message: "Subtipo de consumo é obrigatório",
      });
    }
  });

const ServicoValorOuSalarioSchema = z
  .object({
    habilitado: z.boolean(),
    tipoValor: z.enum(["SALARIO_MINIMO", "OUTRO"]).optional(),
    valor: z.number().optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (!value.habilitado) return;
    if (!value.tipoValor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tipoValor"],
        message: "Tipo de valor é obrigatório",
      });
    }
    if (value.tipoValor === "OUTRO" && (!value.valor || value.valor <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valor"],
        message: "Valor é obrigatório",
      });
    }
  });

const ServicoValorSimplesSchema = z
  .object({
    habilitado: z.boolean(),
    valor: z.number().optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.habilitado && (!value.valor || value.valor <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valor"],
        message: "Valor é obrigatório",
      });
    }
  });

const ServicoPrepostoSchema = z
  .object({
    habilitado: z.boolean(),
    valor: z.number().optional().nullable(),
    inclusoNoDesembaracoCasco: SimNaoSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.habilitado) return;
    if (!value.valor || value.valor <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valor"],
        message: "Valor é obrigatório",
      });
    }
    if (!value.inclusoNoDesembaracoCasco) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["inclusoNoDesembaracoCasco"],
        message: "Campo obrigatório",
      });
    }
  });

const ServicoFreteInternacionalSchema = z
  .object({
    habilitado: z.boolean(),
    ptaxNegociado: z.string().trim().optional().nullable(),
    percentual: z.number().optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (!value.habilitado) return;
    if (!value.ptaxNegociado) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ptaxNegociado"],
        message: "PTAX negociado é obrigatório",
      });
    }
    if (value.percentual == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["percentual"],
        message: "Percentual é obrigatório",
      });
    }
  });

const ServicoSeguroSchema = z
  .object({
    habilitado: z.boolean(),
    valorNegociado: z.number().optional().nullable(),
    descricaoComplementar: z.string().trim().optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (!value.habilitado) return;
    if (!value.valorNegociado || value.valorNegociado <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valorNegociado"],
        message: "Valor negociado é obrigatório",
      });
    }
    if (!value.descricaoComplementar) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["descricaoComplementar"],
        message: "Descrição complementar é obrigatória",
      });
    }
  });

const ServicoFreteRodoviarioSchema = z
  .object({
    habilitado: z.boolean(),
    modalidade: z.enum(["SIM", "CASO_A_CASO"]).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.habilitado && !value.modalidade) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["modalidade"],
        message: "Modalidade é obrigatória",
      });
    }
  });

const RegimeEspecialItemSchema = z.object({
  observacao: z.string().trim().min(1, "Observação é obrigatória"),
  valor: z.number().positive("Valor deve ser maior que zero"),
});

export const ServicosImportacaoSchema = z.object({
  despachoAduaneiroImportacao: ServicoValorOuSalarioSchema,
  preposto: ServicoPrepostoSchema,
  emissaoLiLpco: ServicoValorSimplesSchema,
  cadastroCatalogoProdutos: ServicoValorSimplesSchema,
  assessoria: ServicoValorOuSalarioSchema,
  freteInternacional: ServicoFreteInternacionalSchema,
  seguroInternacional: ServicoSeguroSchema,
  freteRodoviario: ServicoFreteRodoviarioSchema,
  regimeEspecial: z.array(RegimeEspecialItemSchema).default([]),
  emissaoNfe: ServicoValorSimplesSchema,
});

const ServicoOutrosCertificadosSchema = z
  .object({
    habilitado: z.boolean(),
    especificacaoCertificado: z.string().trim().optional().nullable(),
    valor: z.number().optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (!value.habilitado) return;
    if (!value.especificacaoCertificado) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["especificacaoCertificado"],
        message: "Especificação do certificado é obrigatória",
      });
    }
    if (!value.valor || value.valor <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valor"],
        message: "Valor é obrigatório",
      });
    }
  });

export const ServicosExportacaoSchema = z.object({
  despachoAduaneiroExportacao: ServicoValorOuSalarioSchema,
  preposto: ServicoPrepostoSchema,
  certificadoOrigem: ServicoValorSimplesSchema,
  certificadoFitossanitario: ServicoValorSimplesSchema,
  outrosCertificados: ServicoOutrosCertificadosSchema,
  assessoria: ServicoValorOuSalarioSchema,
  freteInternacional: ServicoFreteInternacionalSchema,
  seguroInternacional: ServicoSeguroSchema,
  freteRodoviario: ServicoFreteRodoviarioSchema,
  regimeEspecial: z.array(RegimeEspecialItemSchema).default([]),
});

export const EscopoSchema = z
  .object({
    informacoesFixas: z.object({
      salarioMinimoVigente: z.number().positive("Salário mínimo vigente é obrigatório"),
      dadosBancariosCasco: ContaBancariaSchema,
    }),

    sobreEmpresa: z.object({
      razaoSocial: z.string().trim().min(1, "Razão social é obrigatória"),
      cnpj: z.string().trim().min(14, "CNPJ é obrigatório"),
      inscricaoEstadual: z.string().trim().min(1, "Inscrição Estadual é obrigatória"),
      inscricaoMunicipal: z.string().trim().optional().nullable(),
      enderecoCompletoEscritorio: z
        .string()
        .trim()
        .min(1, "Endereço do escritório é obrigatório"),
      enderecoCompletoArmazem: z
        .string()
        .trim()
        .min(1, "Endereço do armazém é obrigatório"),
      cnaePrincipal: z.string().trim().min(1, "CNAE principal é obrigatório"),
      regimeTributacao: RegimeTributacaoSchema,
      responsavelComercial: ResponsavelComercialSchema,
    }),

    contatos: z.array(ContatoSchema).min(1, "Informe ao menos um contato"),

    operacao: z.object({
      tipos: z.array(TipoOperacaoSchema).min(1, "Selecione ao menos uma operação"),
      importacao: ImportacaoSchema.optional(),
      exportacao: ExportacaoSchema.optional(),
    }),

    servicos: z.object({
      importacao: ServicosImportacaoSchema.optional(),
      exportacao: ServicosExportacaoSchema.optional(),
    }),

    financeiro: z.object({
      dadosBancariosClienteDevolucaoSaldo: ContaBancariaSchema,
      observacoesFinanceiro: z
        .string()
        .trim()
        .min(1, "Observações do financeiro são obrigatórias"),
    }),
  })
  .superRefine((value, ctx) => {
    const temImportacao = value.operacao.tipos.includes("IMPORTACAO");
    const temExportacao = value.operacao.tipos.includes("EXPORTACAO");

    if (temImportacao && !value.operacao.importacao) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["operacao", "importacao"],
        message: "Bloco de importação é obrigatório",
      });
    }

    if (temImportacao && !value.servicos.importacao) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["servicos", "importacao"],
        message: "Serviços de importação são obrigatórios",
      });
    }

    if (temExportacao && !value.operacao.exportacao) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["operacao", "exportacao"],
        message: "Bloco de exportação é obrigatório",
      });
    }

    if (temExportacao && !value.servicos.exportacao) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["servicos", "exportacao"],
        message: "Serviços de exportação são obrigatórios",
      });
    }
  });