/* ============================================================
   cotacao-app.jsx
   Portal PÚBLICO de cotação (fornecedor).
   O fornecedor abre /cotacao/<token>, lê o documento bilíngue
   (fotos · SKU · specs) e preenche preço unitário, MOQ, prazo,
   moeda, validade e Incoterm. Ao enviar, o VP Gestão recebe a
   resposta automaticamente (status → "respondido").
   Sem login, sem cadastro. Reusa window.PFEngine (labels/doc).
   ============================================================ */
const { useState: _coUS, useEffect: _coUE, useRef: _coUR, useMemo: _coUM } = React;

/* rótulo bilíngue conforme idioma do doc */
function coLbl(o, idi) {
  if (!o) return '';
  if (idi === 'pt') return o.pt;
  if (idi === 'en') return o.en;
  return o.pt + ' / ' + o.en;
}

const CO_MOEDAS = [
  { v: 'USD', l: 'USD · Dólar' }, { v: 'EUR', l: 'EUR · Euro' },
  { v: 'CNY', l: 'CNY · Yuan' }, { v: 'BRL', l: 'BRL · Real' },
];
const CO_INCOTERMS = ['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'];

function CoIconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
      <rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>
    </svg>
  );
}

/* Fornecedor não usa NCM/HS — filtro defensivo (mesmo p/ pedidos antigos). */
const CO_NCM_RX = /\bncm\b|\bhs\b|hs\s*code|c[oó]digo\s*ncm/i;
function coAtributos(it) {
  const a = Array.isArray(it.atributos) ? it.atributos : [];
  const ae = Array.isArray(it.atributos_en) ? it.atributos_en : [];
  const out = [];
  a.forEach((x, j) => { if (!CO_NCM_RX.test(x.nome || '')) out.push({ a: x, ae: ae[j] || {} }); });
  return out;
}

/* ---------- Painel de LEITURA de um item (esquerda) ---------- */
function CoItemRead({ it, idx, L, idi, both }) {
  const specs = coAtributos(it);
  return (
    <div className="co-read">
      <div className="co-read-top">
        <div className="co-item-n">{idx + 1}</div>
        <div className="co-item-photo">
          {it.foto ? <img src={it.foto} alt=""/> : <div className="co-no-photo">{coLbl(L.semFoto, idi)}</div>}
        </div>
      </div>
      <div className="co-item-sku">{coLbl(L.sku, idi)}: <b>{it.codigo_interno || it.codigo || '—'}</b></div>
      <div className="co-item-name">{it.denominacao}{both && it.denominacao_en ? <span className="co-en"> · {it.denominacao_en}</span> : ''}</div>
      {(it.detalhamento || it.detalhamento_en) &&
        <div className="co-item-desc">{idi !== 'en' ? it.detalhamento : ''}{both && it.detalhamento_en ? <span className="co-en"> {it.detalhamento_en}</span> : (idi === 'en' ? it.detalhamento_en || it.detalhamento : '')}</div>}
      {specs.length > 0 && (
        <table className="co-specs"><tbody>
          {specs.map(({ a, ae }, j) => (
            <tr key={j}>
              <td className="co-spec-k">{a.nome}{both && ae.nome_en ? ' / ' + ae.nome_en : ''}</td>
              <td className="co-spec-v">{a.valor}{both && ae.valor_en ? ' / ' + ae.valor_en : ''}</td>
            </tr>
          ))}
        </tbody></table>
      )}
      <div className="co-qty-given">
        <span>{coLbl(L.qtd, idi)}: <b>{it.qty}</b></span>
        <span>{coLbl(L.unidade, idi)}: <b>{it.unidade}</b></span>
      </div>
    </div>
  );
}

/* ---------- Painel de PREENCHIMENTO de um item (direita) ---------- */
function CoItemFill({ val, onChange, L, idi, moeda, readOnly }) {
  const f = (k) => (e) => onChange(k, e.target.value);
  return (
    <div className="co-fill">
      <label className="co-f">
        <span>{coLbl(L.precoUnit, idi)} {moeda ? `(${moeda})` : ''} *</span>
        <input className="co-inp" inputMode="decimal" value={val.preco_unit || ''}
          onChange={f('preco_unit')} placeholder="0.00" disabled={readOnly}/>
      </label>
      <div className="co-f-row">
        <label className="co-f">
          <span>{coLbl(L.moq, idi)}</span>
          <input className="co-inp" inputMode="numeric" value={val.moq || ''}
            onChange={f('moq')} placeholder="—" disabled={readOnly}/>
        </label>
        <label className="co-f">
          <span>{coLbl(L.leadTime, idi)}</span>
          <input className="co-inp" value={val.lead_time || ''}
            onChange={f('lead_time')} placeholder={idi === 'en' ? 'e.g. 30 days' : 'ex.: 30 dias'} disabled={readOnly}/>
        </label>
      </div>
      <label className="co-f">
        <span>{coLbl(L.observacoes, idi)}</span>
        <input className="co-inp" value={val.obs || ''} onChange={f('obs')}
          placeholder={idi === 'en' ? 'optional' : 'opcional'} disabled={readOnly}/>
      </label>
    </div>
  );
}

function CotacaoApp() {
  function extractToken() {
    const m = location.pathname.match(/\/cotacao\/([^/]+)/);
    if (m) return decodeURIComponent(m[1]);
    const h = (location.hash || '').replace(/^#/, '');
    if (h) return decodeURIComponent(h);
    return new URLSearchParams(location.search).get('t');
  }
  const token = extractToken();

  const [loading, setLoading] = _coUS(true);
  const [notFound, setNotFound] = _coUS(false);
  const [pedido, setPedido] = _coUS(null);
  const [phase, setPhase] = _coUS('fill'); // fill | sending | done

  /* campos globais da resposta */
  const [moeda, setMoeda] = _coUS('USD');
  const [validade, setValidade] = _coUS('');
  const [incoterm, setIncoterm] = _coUS('FOB');
  const [porto, setPorto] = _coUS('');
  const [obsGeral, setObsGeral] = _coUS('');
  /* campos por item: { produto_id: {preco_unit, moq, lead_time, obs} } */
  const [itemVals, setItemVals] = _coUS({});

  _coUE(() => {
    (async () => {
      if (!token || !window.PFStore) { setLoading(false); setNotFound(true); return; }
      const rec = await window.PFStore.getByToken(token);
      if (!rec) { setLoading(false); setNotFound(true); return; }
      if (rec.status === 'expirado') { setPedido(rec); setLoading(false); return; }
      // semente dos campos por item
      const seed = {};
      (rec.itens || []).forEach(it => { seed[it.produto_id] = { preco_unit: '', moq: '', lead_time: '', obs: '' }; });
      if (rec.status === 'respondido' && rec.resposta) {
        const r = rec.resposta;
        setMoeda(r.moeda || 'USD'); setValidade(r.validade || '');
        setIncoterm(r.incoterm || 'FOB'); setPorto(r.porto || ''); setObsGeral(r.obs_geral || '');
        (r.itens || []).forEach(ri => { if (seed[ri.produto_id]) seed[ri.produto_id] = { preco_unit: ri.preco_unit || '', moq: ri.moq || '', lead_time: ri.lead_time || '', obs: ri.obs || '' }; });
        setItemVals(seed);
        setPedido(rec); setPhase('done'); setLoading(false); return;
      }
      setItemVals(seed);
      const updated = await window.PFStore.marcarVisualizado(token);
      setPedido(updated || rec);
      setLoading(false);
    })();
  }, [token]);

  const doc = _coUM(() => {
    if (!pedido) return null;
    return window.PFEngine.buildDoc(pedido);
  }, [pedido]);

  const setItemVal = (pid, k, v) => setItemVals(prev => ({ ...prev, [pid]: { ...(prev[pid] || {}), [k]: v } }));

  if (loading) {
    return <div className="co-status"><div className="co-spinner"></div><h1>Carregando cotação…</h1><p>Validando o link.</p></div>;
  }
  if (notFound || !pedido) {
    return (
      <div className="co-shell"><div className="co-err">
        <h1>Link inválido</h1>
        <p>Esta cotação não foi encontrada ou o link expirou. Solicite um novo link à VerticalParts.<br/>
        <span className="co-en">This quotation was not found or the link expired. Please request a new link.</span></p>
      </div></div>
    );
  }
  if (pedido.status === 'expirado') {
    return (
      <div className="co-shell"><div className="co-err">
        <h1>Link expirado</h1>
        <p>Este link de cotação expirou. Solicite o reenvio à VerticalParts.<br/>
        <span className="co-en">This quotation link has expired. Please request a new one.</span></p>
      </div></div>
    );
  }

  const L = doc.labels, idi = doc.idioma, both = idi === 'bilingue';
  const forn = doc.fornecedor || {};
  const isImport = forn.tipo !== 'nacional';
  const readOnly = phase === 'done';

  /* validação: preço em todos os itens + moeda */
  const faltaPreco = (doc.itens || []).some(it => !(itemVals[it.produto_id] && String(itemVals[it.produto_id].preco_unit).trim()));
  const canSend = !faltaPreco && !!moeda && phase === 'fill';

  const enviar = async () => {
    if (!canSend) return;
    setPhase('sending');
    const resposta = {
      moeda, validade, incoterm: isImport ? incoterm : '', porto: isImport ? porto : '', obs_geral: obsGeral,
      itens: (doc.itens || []).map(it => {
        const v = itemVals[it.produto_id] || {};
        return { produto_id: it.produto_id, sku: it.codigo_interno || it.codigo, preco_unit: v.preco_unit || '', moq: v.moq || '', lead_time: v.lead_time || '', obs: v.obs || '' };
      }),
    };
    try {
      const updated = await window.PFStore.salvarResposta(token, resposta);
      setPedido(updated);
      setPhase('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      alert('Erro ao enviar / Error: ' + (e.message || e));
      setPhase('fill');
    }
  };

  if (phase === 'sending') {
    return <div className="co-status"><div className="co-spinner"></div><h1>Enviando cotação…</h1><p>Registrando seus preços.</p></div>;
  }

  return (
    <div className="co-shell">
      <div className="co-top">
        <img src="/assets/logo-mark-yellow.png" alt="VerticalParts"/>
        <span className="co-secure"><CoIconLock/> Seguro · Secure</span>
      </div>

      {phase === 'done' && (
        <div className="co-done-banner">
          <div className="co-check">✓</div>
          <div>
            <b>Cotação enviada! · Quotation submitted!</b>
            <div className="co-done-sub">Obrigado. A VerticalParts recebeu seus preços. · Thank you, VerticalParts received your prices.</div>
          </div>
          <button className="co-print" onClick={() => window.print()}>Imprimir / Print</button>
        </div>
      )}

      <div className="co-intro-head">
        <h1>{coLbl(L.titulo, idi)}</h1>
        <div className="co-num">{coLbl(L.numero, idi)} {doc.numero} · {doc.data.pt}{both ? ' / ' + doc.data.en : ''}</div>
        {!readOnly && (
          <p className="co-lead">
            A VerticalParts solicita sua cotação para os itens abaixo. Preencha preço, MOQ e prazo — sem cadastro.<br/>
            <span className="co-en">VerticalParts requests your quotation for the items below. Fill in price, MOQ and lead time — no sign-up.</span>
          </p>
        )}
      </div>

      {/* Partes */}
      <div className="co-parties">
        <div className="co-party">
          <div className="co-party-lbl">{coLbl(L.comprador, idi)}</div>
          <b>{doc.comprador.razao_social}</b>
          <div>CNPJ {doc.comprador.cnpj}</div>
          <div>{doc.comprador.email}</div>
        </div>
        <div className="co-party">
          <div className="co-party-lbl">{coLbl(L.fornecedor, idi)} · {coLbl(isImport ? L.importacao : L.nacional, idi)}</div>
          <b>{forn.nome || '—'}</b>
          {forn.pais && <div>{forn.pais}</div>}
          {forn.email && <div>{forn.email}</div>}
        </div>
      </div>

      {/* Apresentação */}
      {(doc.intro.pt || doc.intro.en) && (
        <div className="co-block">
          <div className="co-sec-lbl">{coLbl(L.intro, idi)}</div>
          {idi !== 'en' && <p>{doc.intro.pt}</p>}
          {both && doc.intro.en && <p className="co-en">{doc.intro.en}</p>}
          {idi === 'en' && <p>{doc.intro.en || doc.intro.pt}</p>}
        </div>
      )}

      {/* Itens */}
      <div className="co-items">
        {(doc.itens || []).map((it, i) => (
          <div className="co-item" key={it.produto_id || i}>
            <CoItemRead it={it} idx={i} L={L} idi={idi} both={both}/>
            <CoItemFill val={itemVals[it.produto_id] || {}} onChange={(k, v) => setItemVal(it.produto_id, k, v)}
              L={L} idi={idi} moeda={moeda} readOnly={readOnly}/>
          </div>
        ))}
      </div>

      {/* Condições gerais */}
      <div className="co-global">
        <div className="co-sec-lbl">{both ? 'Condições da cotação · Quotation terms' : (idi === 'en' ? 'Quotation terms' : 'Condições da cotação')}</div>
        <div className="co-global-grid">
          <label className="co-f">
            <span>{both ? 'Moeda · Currency' : (idi === 'en' ? 'Currency' : 'Moeda')} *</span>
            <select className="co-inp" value={moeda} onChange={e => setMoeda(e.target.value)} disabled={readOnly}>
              {CO_MOEDAS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </label>
          <label className="co-f">
            <span>{both ? 'Validade da proposta · Valid until' : (idi === 'en' ? 'Valid until' : 'Validade da proposta')}</span>
            <input className="co-inp" type="date" value={validade} onChange={e => setValidade(e.target.value)} disabled={readOnly}/>
          </label>
          {isImport && (
            <label className="co-f">
              <span>Incoterm</span>
              <select className="co-inp" value={incoterm} onChange={e => setIncoterm(e.target.value)} disabled={readOnly}>
                {CO_INCOTERMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          )}
          {isImport && (
            <label className="co-f">
              <span>{both ? 'Porto de embarque · Port of loading' : (idi === 'en' ? 'Port of loading' : 'Porto de embarque')}</span>
              <input className="co-inp" value={porto} onChange={e => setPorto(e.target.value)} placeholder={idi === 'en' ? 'e.g. Shanghai' : 'ex.: Shanghai'} disabled={readOnly}/>
            </label>
          )}
        </div>
        <label className="co-f" style={{ marginTop: 10 }}>
          <span>{coLbl(L.observacoes, idi)}</span>
          <textarea className="co-inp" rows={2} value={obsGeral} onChange={e => setObsGeral(e.target.value)}
            placeholder={idi === 'en' ? 'Packaging, certifications, payment terms…' : 'Embalagem, certificações, condições de pagamento…'} disabled={readOnly}/>
        </label>
      </div>

      {!readOnly && (
        <div className="co-actionbar">
          <button className="co-send-btn" disabled={!canSend} onClick={enviar}>
            {both ? 'Enviar cotação · Submit quotation' : (idi === 'en' ? 'Submit quotation' : 'Enviar cotação')}
          </button>
          {!canSend && <p className="co-hint">{faltaPreco ? (idi === 'en' ? 'Fill the unit price of every item.' : 'Preencha o preço unitário de todos os itens.') : ''}</p>}
          <p className="co-foot-meta">Ao enviar, registramos data/hora e IP para confirmação. · By submitting, we log date/time and IP for confirmation.</p>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('co-root')).render(<CotacaoApp/>);
