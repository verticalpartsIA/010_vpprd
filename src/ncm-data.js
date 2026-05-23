/* ============================================================
   ncm-data.js — Mock data para módulo NCM / Ficha Técnica
   Atrelado a projetos de engenharia existentes
   ============================================================ */

window.__VP_NCM = {

  /* Códigos NCM mais usados na empresa (lista typeahead) */
  ncmCatalog: [
    { code: "8428.10.00", desc: "Elevadores e monta-cargas", attrs: "elevador" },
    { code: "8428.40.00", desc: "Escadas e tapetes rolantes", attrs: "escada" },
    { code: "8428.90.20", desc: "Aparelhos para movimentação de cargas", attrs: "carga" },
    { code: "8431.31.10", desc: "Partes de elevadores - cabos de tração", attrs: "cabos" },
    { code: "8431.31.90", desc: "Outras partes de elevadores", attrs: "outras" },
    { code: "8537.10.20", desc: "Quadros de comando até 1000V", attrs: "quadro" },
    { code: "8501.52.20", desc: "Motores elétricos CA — gearless", attrs: "motor" },
    { code: "9026.20.10", desc: "Sensores de pressão", attrs: "sensor" },
    { code: "8536.50.90", desc: "Botoeiras e interruptores elétricos", attrs: "botoeira" },
  ],

  /* Atributos por NCM (varia conforme classificação) */
  attributesByNcm: {
    "8428.10.00": [
      { key: "acionamento", label: "Tipo de acionamento", type: "select", required: true,
        options: ["Elétrico tração", "Hidráulico", "Pneumático", "Gearless MRL"] },
      { key: "capacidade", label: "Capacidade de carga", type: "number", suffix: "kg", required: true, placeholder: "630" },
      { key: "velocidade", label: "Velocidade nominal", type: "decimal", suffix: "m/s", required: true, placeholder: "1.0" },
      { key: "potencia", label: "Potência do motor", type: "decimal", suffix: "kW", required: true, placeholder: "7.5" },
      { key: "paradas", label: "Número de paradas", type: "number", required: true, placeholder: "8" },
      { key: "uso", label: "Uso", type: "radio", required: true, options: ["Residencial", "Comercial", "Industrial"] },
      { key: "tensao", label: "Tensão de alimentação", type: "select", required: true, options: ["220V", "380V", "440V"] },
      { key: "casaMaquinas", label: "Possui casa de máquinas?", type: "toggle", required: true },
    ],
    "8428.40.00": [
      { key: "tipo", label: "Tipo", type: "select", required: true, options: ["Escada rolante", "Esteira rolante", "Travelator"] },
      { key: "inclinacao", label: "Inclinação", type: "select", required: true, options: ["0°", "10°", "12°", "30°", "35°"] },
      { key: "velocidade", label: "Velocidade nominal", type: "decimal", suffix: "m/s", required: true, placeholder: "0.5" },
      { key: "larguraDegrau", label: "Largura do degrau/pallet", type: "select", required: true, options: ["600 mm", "800 mm", "1000 mm"] },
      { key: "potencia", label: "Potência do motor", type: "decimal", suffix: "kW", required: true, placeholder: "11" },
      { key: "uso", label: "Uso", type: "radio", required: true, options: ["Comercial", "Industrial", "Aeroporto"] },
      { key: "tensao", label: "Tensão", type: "select", required: true, options: ["220V Trifásico", "380V Trifásico"] },
    ],
    "8537.10.20": [
      { key: "tensaoMax", label: "Tensão máxima", type: "select", required: true, options: ["220V", "380V", "440V", "600V"] },
      { key: "corrente", label: "Corrente nominal", type: "decimal", suffix: "A", required: true, placeholder: "32" },
      { key: "protecao", label: "Grau de proteção (IP)", type: "select", required: true, options: ["IP20", "IP44", "IP55", "IP65"] },
      { key: "processador", label: "Microprocessado?", type: "toggle", required: true },
    ],
    "8431.31.10": [
      { key: "diametro", label: "Diâmetro", type: "decimal", suffix: "mm", required: true, placeholder: "10" },
      { key: "comprimento", label: "Comprimento", type: "decimal", suffix: "m", required: true, placeholder: "60" },
      { key: "material", label: "Material", type: "select", required: true, options: ["Aço carbono", "Aço inox", "Sintético kevlar"] },
      { key: "cargaRuptura", label: "Carga de ruptura", type: "decimal", suffix: "kN", required: true, placeholder: "82" },
    ],
  },

  /* Fabricantes (Operador Estrangeiro) — já cadastrados */
  fabricantes: [
    { id: "FAB-001", nome: "Hangzhou Lift Co., Ltd.", pais: "China", flag: "🇨🇳",
      logradouro: "No. 588 Xinyuan Road, Industrial Park", cidade: "Hangzhou", subdivisao: "Zhejiang",
      cep: "310018", email: "export@hangzhoulift.cn", tin: "CN91330000123456789X", codigoInterno: "VP-HLC" },
    { id: "FAB-002", nome: "Suzhou Vertical Equipment Co., Ltd.", pais: "China", flag: "🇨🇳",
      logradouro: "Block 12, Suzhou Industrial Park", cidade: "Suzhou", subdivisao: "Jiangsu",
      cep: "215021", email: "trade@suzhouvertical.cn", tin: "CN91320500987654321X", codigoInterno: "VP-SVE" },
    { id: "FAB-003", nome: "Tianjin Control Systems Co., Ltd.", pais: "China", flag: "🇨🇳",
      logradouro: "Binhai New Area, Bldg 7", cidade: "Tianjin", subdivisao: "Tianjin",
      cep: "300457", email: "sales@tjcontrol.cn", tin: "CN91120116554433221X", codigoInterno: "VP-TCS" },
    { id: "FAB-004", nome: "OOCL Industrial Components", pais: "Coreia do Sul", flag: "🇰🇷",
      logradouro: "157 Gwanggyojungang-ro", cidade: "Suwon-si", subdivisao: "Gyeonggi-do",
      cep: "16229", email: "intl@ooclic.kr", tin: "KR1234567890", codigoInterno: "VP-OIC" },
  ],

  /* Produtos cadastrados / em fluxo */
  produtos: [
    { id: "PRD-2026-001", siscomex: "PRD-0000000042", versao: 1, status: "CADASTRADO",
      denominacao: "Elevador elétrico de tração, uso comercial, capacidade 630 kg, 8 paradas",
      ncm: "8428.10.00", ncmDesc: "Elevadores e monta-cargas",
      detalhamento: "Elevador de tração elétrica gearless MRL, capacidade 630 kg (8 passageiros), velocidade 1.0 m/s, 8 paradas, tensão 380V trifásica, comando microprocessado MAX-3000. Conformidade NBR 16858-1/2. Cabine em aço inox AISI 304 escovado, portas automáticas com abertura central. Não possui casa de máquinas.",
      fabricante: "FAB-001", projeto: "ENG-148", engenheiro: null, aprovadoPor: null,
      cadastradoPor: null, cadastradoEm: "2026-05-22",
      atributos: { acionamento: "Gearless MRL", capacidade: "630", velocidade: "1.0", potencia: "7.5", paradas: "8", uso: "Comercial", tensao: "380V", casaMaquinas: false },
      imagens: 5, fichaPdf: "Datasheet_HLC_9300.pdf", updatedAt: "há 1d" },

    { id: "PRD-2026-002", siscomex: "PRD-0000000039", versao: 2, status: "CADASTRADO",
      denominacao: "Quadro de comando para elevador, microprocessado, até 380V",
      ncm: "8537.10.20", ncmDesc: "Quadros de comando até 1000V",
      detalhamento: "Quadro de comando MAX-3000 para elevadores, tensão até 380V CA trifásica, corrente nominal 32A, grau de proteção IP44, microprocessado com 8 modos de operação. Inclui inversor de frequência e UPS interno para resgate automático.",
      fabricante: "FAB-003", projeto: "ENG-145", engenheiro: null, aprovadoPor: null,
      cadastradoPor: null, cadastradoEm: "2026-04-18",
      atributos: { tensaoMax: "380V", corrente: "32", protecao: "IP44", processador: true },
      imagens: 4, fichaPdf: "QC_MAX3000_specs.pdf", updatedAt: "há 35d" },

    { id: "PRD-2026-003", siscomex: "PRD-0000000018", versao: 1, status: "CADASTRADO",
      denominacao: "Escada rolante comercial, 30° de inclinação, 1000 mm",
      ncm: "8428.40.00", ncmDesc: "Escadas e tapetes rolantes",
      detalhamento: "Escada rolante comercial linha OAK, inclinação 30°, largura de degrau 1000 mm, velocidade 0.5 m/s, motor 11 kW, alimentação 380V trifásica. Estrutura em aço galvanizado.",
      fabricante: "FAB-002", projeto: "ENG-152", engenheiro: null, aprovadoPor: null,
      cadastradoPor: null, cadastradoEm: "2026-03-04",
      atributos: { tipo: "Escada rolante", inclinacao: "30°", velocidade: "0.5", larguraDegrau: "1000 mm", potencia: "11", uso: "Comercial", tensao: "380V Trifásico" },
      imagens: 5, fichaPdf: "OAK_30deg_datasheet.pdf", updatedAt: "há 79d" },

    { id: "PRD-2026-004", siscomex: null, versao: 1, status: "APROVADO",
      denominacao: "Cabos de tração de aço, 10 mm, 60 metros",
      ncm: "8431.31.10", ncmDesc: "Partes de elevadores - cabos de tração",
      detalhamento: "Cabo de tração para elevadores, diâmetro nominal 10 mm, comprimento 60 m, construção 8x19+Seale, alma central têxtil, carga de ruptura mínima 82 kN. Conforme EN 12385-5.",
      fabricante: "FAB-001", projeto: "ENG-147", engenheiro: null, aprovadoPor: null,
      cadastradoPor: null, cadastradoEm: null,
      atributos: { diametro: "10", comprimento: "60", material: "Aço carbono", cargaRuptura: "82" },
      imagens: 3, fichaPdf: "Cable_8x19_Seale.pdf", updatedAt: "há 2d" },

    { id: "PRD-2026-005", siscomex: null, versao: 1, status: "AGUARD_JURIDICO",
      denominacao: "Elevador elétrico de tração, uso comercial, 1000 kg",
      ncm: "8428.10.00", ncmDesc: "Elevadores e monta-cargas",
      detalhamento: "Elevador de tração elétrica gearless MRL, capacidade 1000 kg (13 passageiros), velocidade 1.6 m/s, 12 paradas, tensão 380V. Cabine em aço inox espelhado com piso em granito São Gabriel.",
      fabricante: "FAB-001", projeto: "ENG-148", engenheiro: null, aprovadoPor: null,
      cadastradoPor: null, cadastradoEm: null,
      atributos: { acionamento: "Gearless MRL", capacidade: "1000", velocidade: "1.6", potencia: "11", paradas: "12", uso: "Comercial", tensao: "380V", casaMaquinas: false },
      imagens: 4, fichaPdf: "HLC_9300_1000kg.pdf", updatedAt: "há 3d" },

    { id: "PRD-2026-006", siscomex: null, versao: 1, status: "AGUARD_JURIDICO",
      denominacao: "Esteira rolante para shopping, 12° de inclinação",
      ncm: "8428.40.00", ncmDesc: "Escadas e tapetes rolantes",
      detalhamento: "Esteira rolante (travelator) SEQUOIA -12°, largura pallet 1000 mm, velocidade 0.5 m/s, motor 11 kW, alimentação 380V. Aplicação em shoppings e supermercados com transporte de carrinhos.",
      fabricante: "FAB-002", projeto: "ENG-150", engenheiro: null, aprovadoPor: null,
      cadastradoPor: null, cadastradoEm: null,
      atributos: { tipo: "Esteira rolante", inclinacao: "12°", velocidade: "0.5", larguraDegrau: "1000 mm", potencia: "11", uso: "Comercial", tensao: "380V Trifásico" },
      imagens: 3, fichaPdf: "SEQUOIA_12deg.pdf", updatedAt: "há 1d" },

    { id: "PRD-2026-007", siscomex: null, versao: 1, status: "AGUARD_JURIDICO",
      denominacao: "Botoeira de cabine em aço inox com Braille — linha LOP-35",
      ncm: "8536.50.90", ncmDesc: "Botoeiras e interruptores elétricos",
      detalhamento: "Botoeira de cabine de elevador, linha LOP-35, acabamento em aço inox AISI 304, com Braille conforme NBR 16858, display TFT 4.3'' colorido, botão de alarme e abertura de porta. Tensão 24V CC.",
      fabricante: "FAB-003", projeto: "ENG-146", engenheiro: null, aprovadoPor: null,
      cadastradoPor: null, cadastradoEm: null,
      atributos: {},
      imagens: 2, fichaPdf: "LOP-35_specs.pdf", updatedAt: "há 5d" },

    { id: "PRD-2026-008", siscomex: null, versao: 1, status: "EM_PREENCHIMENTO",
      denominacao: "Motor elétrico CA gearless para elevadores, 7.5 kW",
      ncm: "8501.52.20", ncmDesc: "Motores elétricos CA — gearless",
      detalhamento: "",
      fabricante: "FAB-001", projeto: "ENG-148", engenheiro: null, aprovadoPor: null,
      cadastradoPor: null, cadastradoEm: null,
      atributos: {},
      imagens: 1, fichaPdf: null, updatedAt: "há 7d" },

    { id: "PRD-2026-009", siscomex: null, versao: 1, status: "EM_PREENCHIMENTO",
      denominacao: "Sensores de pressão hidráulica — elevadores",
      ncm: null, ncmDesc: null, detalhamento: "",
      fabricante: null, projeto: "ENG-153", engenheiro: null, aprovadoPor: null,
      cadastradoPor: null, cadastradoEm: null,
      atributos: {}, imagens: 0, fichaPdf: null, updatedAt: "há 8d" },

    { id: "PRD-2026-010", siscomex: null, versao: 1, status: "NAO_INICIADO",
      denominacao: "", ncm: null, ncmDesc: null, detalhamento: "",
      fabricante: null, projeto: "ENG-148", engenheiro: null, aprovadoPor: null,
      cadastradoPor: null, cadastradoEm: null,
      atributos: {}, imagens: 0, fichaPdf: null, updatedAt: "novo" },
  ],

  /* Histórico de versões de um produto */
  historico: [
    { data: "2026-05-22 09:00", versao: 1, situacao: "Ativo", usuario: "—", obs: "Criação do produto · Cadastrado no Siscomex" },
    { data: "2026-05-19 14:30", versao: 1, situacao: "Aprovado", usuario: "—", obs: "Aprovação jurídica · NCM validado" },
    { data: "2026-05-17 11:20", versao: 1, situacao: "Aguard. Jurídico", usuario: "—", obs: "Envio para revisão jurídica" },
    { data: "2026-04-15 11:30", versao: 1, situacao: "Rascunho", usuario: "—", obs: "Inclusão inicial do produto" },
  ],
};
