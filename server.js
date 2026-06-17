/* ============================================================
   server.js — VP Gestão · VerticalParts
   Servidor Express: hospeda o app estático + proxy seguro para o
   Supabase do projeto "Propostas" (service role fica SÓ no servidor).
   Compatível com Hostinger Node.js (process.env.PORT injetado).
   ============================================================ */

'use strict';

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ---------- Security headers (helmet-equivalent, sem dependência extra) ---------- */
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '0');               // modern browsers ignore this; disable to avoid misconfiguration
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  next();
});

/* ---------- Rate limiter simples para rotas /api (sem dependência externa) ----------
   Janela de 60 s · máx 90 req/ip. Limpa entradas expiradas a cada 5 min. */
const _rl = new Map();
setInterval(() => { const now = Date.now(); _rl.forEach((v, k) => { if (now > v.r) _rl.delete(k); }); }, 300_000).unref();
function apiRateLimit(req, res, next) {
  const ip  = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const e   = _rl.get(ip);
  if (!e || now > e.r) { _rl.set(ip, { c: 1, r: now + 60_000 }); return next(); }
  if (e.c >= 90) return res.status(429).json({ ok: false, error: 'Muitas requisições. Aguarde e tente novamente.' });
  e.c++;
  next();
}
app.use('/api', apiRateLimit);

app.use(express.json({ limit: '4mb' }));

/* ---------- Credenciais do projeto Propostas (service role) ----------
   Ordem: env var (produção/Hostinger) → arquivo local .propostas-key.js
   (fora do git) → vazio (proxy desligado). NUNCA expor no front-end. */
let PROPOSTAS_URL = process.env.PROPOSTAS_SB_URL || '';
let PROPOSTAS_SVC = process.env.PROPOSTAS_SB_SVC || '';
if (!PROPOSTAS_SVC) {
  try {
    const k = require('./.propostas-key.js');
    PROPOSTAS_URL = PROPOSTAS_URL || k.url;
    PROPOSTAS_SVC = k.serviceKey;
  } catch (e) { /* sem chave local — proxy fica desligado */ }
}
const PROPOSTAS_ON = !!(PROPOSTAS_URL && PROPOSTAS_SVC);

/* Helper: chama o PostgREST do projeto Propostas com a service role */
async function sbProp(pathQuery, opts = {}) {
  const res = await fetch(`${PROPOSTAS_URL}/rest/v1/${pathQuery}`, {
    ...opts,
    headers: {
      apikey: PROPOSTAS_SVC,
      Authorization: `Bearer ${PROPOSTAS_SVC}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  return { ok: res.ok, status: res.status, data };
}

/* ---------- API: Propostas (somente leitura) ---------- */

// Lista enxuta para o autocomplete da "Proposta de Referência"
app.get('/api/propostas/list', async (_req, res) => {
  if (!PROPOSTAS_ON) return res.json({ ok: true, propostas: [] });
  const q = 'propostas?select=numero,titulo,valor_total,status,clientes(razao_social)&order=numero.desc&limit=500';
  const r = await sbProp(q);
  if (!r.ok) return res.status(502).json({ ok: false, error: 'Falha ao listar propostas', detail: r.data });
  const propostas = (r.data || []).map(p => ({
    numero: p.numero,
    titulo: p.titulo || '',
    cliente: p.clientes?.razao_social || '',
    valor_total: Number(p.valor_total) || 0,
    status: p.status || '',
  }));
  res.json({ ok: true, propostas });
});

// Detalhe de UMA proposta (por número) para herança no contrato
app.get('/api/propostas/:numero', async (req, res) => {
  if (!PROPOSTAS_ON) return res.status(503).json({ ok: false, error: 'Proxy Propostas desligado (sem service key)' });
  const numero = String(req.params.numero).replace(/[^0-9]/g, '');
  if (!numero) return res.status(400).json({ ok: false, error: 'Número inválido' });
  const q = `propostas?select=numero,titulo,valor_total,condicao_pagamento,prazo_entrega,proposal_type,data_json,clientes(razao_social,cnpj,cidade,estado,contato,email,telefone)&numero=eq.${numero}&limit=1`;
  const r = await sbProp(q);
  if (!r.ok || !Array.isArray(r.data) || r.data.length === 0)
    return res.status(404).json({ ok: false, error: 'Proposta não encontrada' });
  const p  = r.data[0];
  const dj = p.data_json || {};
  const cli = p.clientes || {};
  const djc = dj.client || {};
  const pay = dj.paymentPlan || {};
  res.json({ ok: true, proposta: {
    numero: p.numero,
    titulo: p.titulo || '',
    proposal_type: p.proposal_type || '',
    valor_total: Number(p.valor_total) || Number(dj?.financials?.unitPrice) || 0,
    condicao_pagamento: p.condicao_pagamento || dj?.financials?.paymentTerms || '',
    prazo_entrega: p.prazo_entrega || '',
    cliente: {
      razao_social: cli.razao_social || djc.name || '',
      cnpj:    cli.cnpj || djc.cnpj || '',
      cidade:  cli.cidade || djc.city || '',
      estado:  cli.estado || djc.state || '',
      contato: cli.contato || djc.contactPerson || '',
      email:   cli.email || djc.email || '',
      telefone:cli.telefone || djc.phone || '',
      endereco: djc.address || '',
      cep:      djc.zip || '',
    },
    pagamento: {
      installments: Number(pay.installments) || 0,
      downPaymentPercent: Number(pay.downPaymentPercent) || 0,
    },
  }});
});

/* ---------- API: Minuta (HTML do contrato por proposta) ----------
   Espelha o padrão de produção: tabela `minutas` (proposal_key, html). */
app.get('/api/minuta/:key', async (req, res) => {
  if (!PROPOSTAS_ON) return res.status(503).json({ ok: false, error: 'Proxy desligado' });
  const key = encodeURIComponent(req.params.key);
  const r = await sbProp(`minutas?select=html&proposal_key=eq.${key}&limit=1`);
  if (!r.ok) return res.status(502).json({ ok: false, error: 'Falha ao buscar minuta' });
  res.json({ ok: true, html: (Array.isArray(r.data) && r.data[0]?.html) || '' });
});

app.post('/api/minuta', async (req, res) => {
  if (!PROPOSTAS_ON) return res.status(503).json({ ok: false, error: 'Proxy desligado' });
  const { proposal_key, html } = req.body || {};
  if (!proposal_key) return res.status(400).json({ ok: false, error: 'proposal_key obrigatório' });
  const r = await sbProp('minutas?on_conflict=proposal_key', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ proposal_key: String(proposal_key), html: String(html || ''), atualizado_em: new Date().toISOString() }),
  });
  if (!r.ok) return res.status(502).json({ ok: false, error: 'Falha ao salvar minuta', detail: r.data });
  res.json({ ok: true });
});

app.get('/api/health', (_req, res) => res.json({ ok: true, propostas_proxy: PROPOSTAS_ON }));

/* ---------- Rota pública de assinatura (antes do estático) ----------
   /assinar/<token> → entrega assinar.html. O token é extraído no client. */
app.get('/assinar/:token', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, 'assinar.html'));
});

/* ---------- Portal público de cotação (fornecedor) ----------
   /cotacao/<token> → entrega cotacao.html. O token é lido no client. */
app.get('/cotacao/:token', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, 'cotacao.html'));
});

/* ---------- Estáticos ---------- */
app.use(express.static(path.join(__dirname), {
  index: 'index.html',
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    else res.setHeader('Cache-Control', 'public, max-age=3600');
  },
}));

/* Catch-all SPA */
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => {
  console.log(`✅ VP Gestão rodando na porta ${PORT}  · Proxy Propostas: ${PROPOSTAS_ON ? 'ON' : 'OFF'}`);
});
