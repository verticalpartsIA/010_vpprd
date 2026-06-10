/* ============================================================
   ficha-workflow-store.js
   Persistência do workflow por setores + histórico append-only
   (tabela fichas_historico). Cada transição faz 3 coisas:
   (a) muda etapa/setor na ficha, (b) grava histórico,
   (c) notifica o setor de destino (alertas).
   window.FWFStore — depende de window.FWF.
   ============================================================ */
(function () {
  'use strict';

  function sb() { return (window.__VP_SB || {}).sb; }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /* ---------- Ator atual (role do app = setor; sem login individual) ---------- */
  function atorAtual(role) {
    const r = role || (function () {
      try { return JSON.parse(localStorage.getItem('vpprd.role')) || 'admin'; }
      catch (e) { return 'admin'; }
    }());
    const setor = window.FWF.setor(r === 'admin' ? 'comercial' : r);
    return {
      id: null,
      nome: r === 'admin' ? 'Admin' : setor.label,
      setor: r === 'admin' ? 'admin' : setor.id,
    };
  }

  function fmtDateTime(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  /* ---------- Histórico (append-only) ---------- */
  async function registrar(ev) {
    const c = sb(); if (!c) return;
    const row = {
      ficha_id: ev.ficha_id || null,
      produto_id: ev.produto_id || null,
      ator_id: ev.ator_id || null,
      ator_nome: ev.ator_nome || 'Sistema',
      ator_setor: ev.ator_setor || null,
      acao: ev.acao,
      de_etapa: ev.de_etapa || null,
      para_etapa: ev.para_etapa || null,
      detalhe: ev.detalhe || null,
    };
    const { error } = await c.from('fichas_historico').insert(row);
    if (error) console.warn('[FWFStore] historico falhou', error.message);
  }

  async function historico(fichaId, produtoId) {
    const c = sb(); if (!c) return [];
    let q = c.from('fichas_historico').select('*').order('criado_em', { ascending: false }).limit(200);
    if (fichaId && produtoId) q = q.or(`ficha_id.eq.${fichaId},produto_id.eq.${produtoId}`);
    else if (fichaId) q = q.eq('ficha_id', fichaId);
    else if (produtoId) q = q.eq('produto_id', produtoId);
    else return [];
    const { data } = await q;
    return data || [];
  }

  /* ---------- Notificação interna (Geral › Notificações) ---------- */
  async function notificar(ficha, paraEtapa, ator) {
    try {
      const c = sb(); if (!c) return;
      const e = window.FWF.etapa(paraEtapa);
      const setorDest = window.FWF.setor(window.FWF.setorResponsavel(paraEtapa));
      await c.from('alertas').insert({
        id: 'fw-' + uuid(),
        level: 'info',
        title: `Ficha ${ficha.numero_documento || ''} → ${setorDest.label}: ${e.label}`,
        sub: `${ficha.nome_produto || 'Produto'} · movida por ${ator.nome} · ${fmtDateTime(Date.now())}`,
        module: setorDest.label,
        resolved: false,
      });
    } catch (err) { console.warn('[FWFStore] notificar falhou', err); }
  }

  /* ---------- Ficha vinculada ao produto do Catálogo ---------- */
  async function getFichaByProduto(produtoId) {
    const c = sb(); if (!c || !produtoId) return null;
    const { data } = await c.from('fichas_tecnicas')
      .select('id, numero_documento, nome_produto, etapa, setor_responsavel, cliente_lead, revisao, arquivado, produto_id, criado_em, atualizado_em')
      .eq('produto_id', produtoId)
      .order('criado_em', { ascending: false })
      .limit(1).maybeSingle();
    return data || null;
  }

  /* ---------- Transição de etapa (handoff entre setores) ---------- */
  async function transicao(ficha, paraEtapa, ator, acao, detalhe) {
    const c = sb(); if (!c) throw new Error('Supabase indisponível');
    const deEtapa = ficha.etapa || 'comercial_rascunho';
    const setorResp = window.FWF.setorResponsavel(paraEtapa);
    const patch = {
      etapa: paraEtapa,
      setor_responsavel: setorResp,
      atualizado_em: new Date().toISOString(),
    };
    const { error } = await c.from('fichas_tecnicas').update(patch).eq('id', ficha.id);
    if (error) throw error;
    await registrar({
      ficha_id: ficha.id, produto_id: ficha.produto_id,
      ator_nome: ator.nome, ator_setor: ator.setor,
      acao: acao || 'avancou', de_etapa: deEtapa, para_etapa: paraEtapa,
      detalhe: detalhe || null,
    });
    await notificar(ficha, paraEtapa, ator);
    return { ...ficha, ...patch };
  }

  /* ---------- Carimbinho: solicitar revisão ---------- */
  async function solicitarRevisao(ficha, motivo, ator) {
    const c = sb(); if (!c) throw new Error('Supabase indisponível');
    const revisao = { solicitada_por: ator.nome, setor: ator.setor, motivo: motivo || '', em: new Date().toISOString() };
    const { error } = await c.from('fichas_tecnicas')
      .update({ revisao, atualizado_em: new Date().toISOString() }).eq('id', ficha.id);
    if (error) throw error;
    await registrar({
      ficha_id: ficha.id, produto_id: ficha.produto_id,
      ator_nome: ator.nome, ator_setor: ator.setor,
      acao: 'revisao', de_etapa: ficha.etapa, para_etapa: ficha.etapa,
      detalhe: { motivo },
    });
    try {
      await sb().from('alertas').insert({
        id: 'fw-' + uuid(), level: 'warning',
        title: `Revisão solicitada — ficha ${ficha.numero_documento || ''}`,
        sub: `${ficha.nome_produto || ''} · por ${ator.nome}${motivo ? ' · "' + motivo.slice(0, 80) + '"' : ''}`,
        module: 'Engenharia', resolved: false,
      });
    } catch (e) { /* alerta é best-effort */ }
    return { ...ficha, revisao };
  }

  async function limparRevisao(ficha, ator) {
    const c = sb(); if (!c) return ficha;
    await c.from('fichas_tecnicas').update({ revisao: null, atualizado_em: new Date().toISOString() }).eq('id', ficha.id);
    await registrar({
      ficha_id: ficha.id, produto_id: ficha.produto_id,
      ator_nome: ator.nome, ator_setor: ator.setor,
      acao: 'revisao_ok', de_etapa: ficha.etapa, para_etapa: ficha.etapa,
      detalhe: { resolvida: true },
    });
    return { ...ficha, revisao: null };
  }

  /* ---------- Arquivar / desarquivar produto (soft-hide) ---------- */
  async function arquivarProduto(produto, ficha, on, ator) {
    const c = sb(); if (!c) throw new Error('Supabase indisponível');
    const { error } = await c.from('catalogo_produtos').update({ arquivado: !!on }).eq('id', produto.id);
    if (error) throw error;
    if (ficha) {
      await c.from('fichas_tecnicas').update({ arquivado: !!on }).eq('id', ficha.id);
    }
    await registrar({
      ficha_id: ficha ? ficha.id : null, produto_id: produto.id,
      ator_nome: ator.nome, ator_setor: ator.setor,
      acao: on ? 'arquivou' : 'desarquivou',
      de_etapa: ficha ? ficha.etapa : null, para_etapa: ficha ? ficha.etapa : null,
      detalhe: { produto: produto.denominacao || produto.codigo },
    });
  }

  /* ---------- Cliente lead (nome + WhatsApp coletados pelo vendedor) ---------- */
  async function salvarClienteLead(ficha, lead, ator) {
    const c = sb(); if (!c) throw new Error('Supabase indisponível');
    const cliente_lead = { nome: lead.nome || '', whatsapp: lead.whatsapp || '', observacao: lead.observacao || '' };
    const { error } = await c.from('fichas_tecnicas')
      .update({ cliente_lead, atualizado_em: new Date().toISOString() }).eq('id', ficha.id);
    if (error) throw error;
    await registrar({
      ficha_id: ficha.id, produto_id: ficha.produto_id,
      ator_nome: ator.nome, ator_setor: ator.setor,
      acao: 'cliente_lead', de_etapa: ficha.etapa, para_etapa: ficha.etapa,
      detalhe: { nome: cliente_lead.nome },
    });
    return { ...ficha, cliente_lead };
  }

  window.FWFStore = {
    atorAtual, fmtDateTime,
    registrar, historico, notificar,
    getFichaByProduto, transicao,
    solicitarRevisao, limparRevisao,
    arquivarProduto, salvarClienteLead,
  };
}());
