/* ============================================================
   pedido-fornecedor-engine.js
   Modelo do documento "Solicitação de Cotação (RFQ)" a fornecedor,
   compilado a partir de itens do Catálogo de Produtos.
   Bilíngue PT-BR | EN. Sem dependências — JS puro (window.PFEngine).
   ============================================================ */
(function () {
  'use strict';

  /* Comprador fixo — VerticalParts (quem solicita a cotação). */
  const COMPRADOR = {
    razao_social: 'VERTICAL PARTS LTDA-ME',
    cnpj: '15.822.325/0001-27',
    endereco: 'Guarulhos/SP — Brasil',
    email: 'compras@verticalparts.com.br',
    site: 'verticalparts.com.br',
  };

  /* Rótulos bilíngues do documento. */
  const LABELS = {
    titulo:       { pt: 'Solicitação de Cotação',        en: 'Request for Quotation (RFQ)' },
    numero:       { pt: 'Nº',                            en: 'No.' },
    data:         { pt: 'Data',                          en: 'Date' },
    comprador:    { pt: 'Comprador',                     en: 'Buyer' },
    fornecedor:   { pt: 'Fornecedor',                    en: 'Supplier' },
    modalidade:   { pt: 'Modalidade',                    en: 'Type' },
    item:         { pt: 'Item',                          en: 'Item' },
    produto:      { pt: 'Produto',                       en: 'Product' },
    codigo:       { pt: 'Código interno',                en: 'Internal code' },
    sku:          { pt: 'SKU VerticalParts',             en: 'VerticalParts SKU' },
    ncm:          { pt: 'NCM / HS',                      en: 'NCM / HS code' },
    descricao:    { pt: 'Descrição técnica',             en: 'Technical description' },
    especif:      { pt: 'Especificações',                en: 'Specifications' },
    qtd:          { pt: 'Qtd.',                          en: 'Qty' },
    unidade:      { pt: 'Unid.',                         en: 'Unit' },
    precoUnit:    { pt: 'Preço unit.',                   en: 'Unit price' },
    moq:          { pt: 'MOQ',                           en: 'MOQ' },
    leadTime:     { pt: 'Prazo de produção',             en: 'Lead time' },
    intro:        { pt: 'Apresentação',                  en: 'Introduction' },
    observacoes:  { pt: 'Observações',                   en: 'Notes' },
    semFoto:      { pt: '(sem foto)',                    en: '(no photo)' },
    aPreencher:   { pt: 'A preencher pelo fornecedor',   en: 'To be filled by the supplier' },
    importacao:   { pt: 'Importação',                    en: 'Import' },
    nacional:     { pt: 'Nacional',                      en: 'Domestic' },
  };

  function dataHoje() {
    const d = new Date();
    const pt = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const en = d.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
    return { pt, en, iso: d.toISOString().slice(0, 10) };
  }

  /* Converte uma linha de catalogo_produtos no item-esqueleto do RFQ.
     Campos *_en começam vazios e são preenchidos pela tradução (store). */
  function buildItem(prod) {
    // Fornecedor não usa NCM/HS — remove esses atributos do documento.
    const atributos = (Array.isArray(prod.atributos) ? prod.atributos : [])
      .filter(a => !/\bncm\b|\bhs\b|hs\s*code|c[oó]digo\s*ncm/i.test(a.nome || ''));
    return {
      produto_id: prod.id,
      codigo: prod.codigo || '',
      codigo_interno: prod.codigo_interno || '',
      ncm: prod.ncm || '',
      ncm_descricao: prod.ncm_descricao || '',
      denominacao: prod.denominacao || '',
      detalhamento: prod.detalhamento || '',
      unidade: prod.unidade_medida || 'UN',
      atributos: atributos.map(a => ({ nome: a.nome || '', valor: a.valor || '' })),
      qty: 1,
      foto: null,           // resolvida no store (da ficha vinculada)
      // traduções (preenchidas via vp-translate):
      denominacao_en: '',
      detalhamento_en: '',
      ncm_descricao_en: '',
      atributos_en: [],     // [{nome_en, valor_en}]
    };
  }

  /* Monta o snapshot do documento (para preview e persistência). */
  function buildDoc(state) {
    return {
      titulo: LABELS.titulo,
      numero: state.numero_documento || '—',
      data: dataHoje(),
      comprador: COMPRADOR,
      fornecedor: state.fornecedor || {},
      modo: state.modo || 'rfq',
      idioma: state.idioma || 'bilingue',
      intro: { pt: state.intro_pt || '', en: state.intro_en || '' },
      observacoes: { pt: state.observacoes_pt || '', en: state.observacoes_en || '' },
      itens: Array.isArray(state.itens) ? state.itens : [],
      labels: LABELS,
    };
  }

  window.PFEngine = { COMPRADOR, LABELS, dataHoje, buildItem, buildDoc };
}());
