/* ============================================================
   ficha-workflow-engine.js
   Máquina de estados do funil de pré-venda de item importado:
   Comercial → Engenharia → Comercial → Financeiro → Comercial
   → Cliente → Importação → Publicado.
   Status por SETOR (nunca por pessoa). Quem delega é sempre o
   setor anterior. Vive na ficha técnica; o produto do Catálogo
   exibe o stepper. Exporta window.FWF (puro, sem dependências).
   ============================================================ */
(function () {
  'use strict';

  const SETORES = {
    comercial:  { id: 'comercial',  label: 'Comercial',  cor: '#2563eb' },
    engenharia: { id: 'engenharia', label: 'Engenharia', cor: '#7c3aed' },
    financeiro: { id: 'financeiro', label: 'Financeiro', cor: '#059669' },
    importacao: { id: 'importacao', label: 'Importação', cor: '#b45309' },
    cliente:    { id: 'cliente',    label: 'Cliente',    cor: '#64748b' },
  };

  /* Etapas em ordem. `setor` = quem deve agir agora. */
  const ETAPAS = [
    { id: 'comercial_rascunho', n: 1, setor: 'comercial',  label: 'Rascunho do vendedor',      desc: 'Vendedor coleta o básico (cliente + o que precisa)' },
    { id: 'engenharia',         n: 2, setor: 'engenharia', label: 'Engenharia',                desc: 'Completa a ficha técnica e o desenho (se preciso)' },
    { id: 'comercial_custo',    n: 3, setor: 'comercial',  label: 'Conferência do vendedor',   desc: 'Vendedor confere e solicita custo' },
    { id: 'financeiro',         n: 4, setor: 'financeiro', label: 'Custo & markup',            desc: 'Financeiro levanta custos e forma o preço de venda' },
    { id: 'comercial_proposta', n: 5, setor: 'comercial',  label: 'Proposta (Omie)',           desc: 'Vendedor monta e envia a proposta ao cliente' },
    { id: 'cliente_analise',    n: 6, setor: 'cliente',    label: 'Cliente em análise',        desc: 'Aguardando decisão do cliente' },
    { id: 'aprovado',           n: 7, setor: 'comercial',  label: 'Aprovado pelo cliente',     desc: 'Cliente aceitou — encaminhar à Importação' },
    { id: 'importacao',         n: 8, setor: 'importacao', label: 'Importação · RFQ',          desc: 'Flegar o produto e cotar com o fornecedor' },
    { id: 'publicado',          n: 9, setor: 'importacao', label: 'Publicado',                 desc: 'Cadastrado no Omie · Catálogo DUIMP' },
  ];

  /* Transições permitidas a partir de cada etapa.
     `avancar` = caminho feliz; `devolver` = volta uma casa. */
  const TRANSICOES = {
    comercial_rascunho: { avancar: { para: 'engenharia',         label: 'Enviar p/ Engenharia',        acao: 'avancou' } },
    engenharia:         { avancar: { para: 'comercial_custo',    label: 'Devolver ao Comercial',       acao: 'avancou' },
                          devolver:{ para: 'comercial_rascunho', label: 'Devolver c/ pendência',       acao: 'devolveu' } },
    comercial_custo:    { avancar: { para: 'financeiro',         label: 'Solicitar custo (Financeiro)',acao: 'avancou' },
                          devolver:{ para: 'engenharia',         label: 'Devolver à Engenharia',       acao: 'devolveu' } },
    financeiro:         { avancar: { para: 'comercial_proposta', label: 'Devolver c/ preço formado',   acao: 'avancou' },
                          devolver:{ para: 'comercial_custo',    label: 'Devolver ao Comercial',       acao: 'devolveu' } },
    comercial_proposta: { avancar: { para: 'cliente_analise',    label: 'Proposta enviada ao cliente', acao: 'avancou' } },
    cliente_analise:    { avancar: { para: 'aprovado',           label: 'Cliente aprovou ✓',           acao: 'avancou' },
                          devolver:{ para: 'comercial_proposta', label: 'Cliente pediu ajuste',        acao: 'devolveu' } },
    aprovado:           { avancar: { para: 'importacao',         label: 'Enviar p/ Importação',        acao: 'avancou' } },
    importacao:         { avancar: { para: 'publicado',          label: 'Marcar como publicado',       acao: 'publicou' } },
    publicado:          {},
  };

  const byId = {};
  ETAPAS.forEach((e) => { byId[e.id] = e; });

  function etapa(id) { return byId[id] || byId.comercial_rascunho; }
  function setor(id) { return SETORES[id] || { id, label: id, cor: '#888' }; }
  function transicoes(etapaId) { return TRANSICOES[etapaId] || {}; }

  /* Quem pode agir: admin sempre; senão, só o setor da vez.
     (cliente_analise fica com o Comercial — é ele quem acompanha o cliente) */
  function podeAgir(role, etapaId) {
    if (role === 'admin') return true;
    const e = etapa(etapaId);
    const dono = e.setor === 'cliente' ? 'comercial' : e.setor;
    return role === dono;
  }

  /* Setor responsável "operacional" da etapa (cliente → comercial acompanha) */
  function setorResponsavel(etapaId) {
    const e = etapa(etapaId);
    return e.setor === 'cliente' ? 'comercial' : e.setor;
  }

  window.FWF = { SETORES, ETAPAS, TRANSICOES, etapa, setor, transicoes, podeAgir, setorResponsavel };
}());
