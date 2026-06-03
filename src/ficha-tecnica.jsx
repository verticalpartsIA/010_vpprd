/* ============================================================
   ficha-tecnica.jsx
   FichaTecnicaPage — wizard universal + dashboard de fichas +
   overlay de impressão. Persiste em fichas_tecnicas e sincroniza
   com catalogo_produtos.
   ============================================================ */
const { useState: _ftUS, useEffect: _ftUE, useMemo: _ftUM, useRef: _ftUR } = React;

/* ============================================================
   ICONS (categorias)
   ============================================================ */
const FT_ICONS = {
  ruler: 'M3 17 17 3l4 4L7 21z M7 13l2 2 M11 9l2 2 M15 5l2 2',
  weight: 'M5 7h14l1 13H4z M9 7a3 3 0 0 1 6 0',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  gauge: 'M12 14 18 8 M3 18a9 9 0 1 1 18 0',
  droplet: 'M12 3s6 6 6 11a6 6 0 0 1-12 0c0-5 6-11 6-11z',
  wave: 'M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0',
  cog: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M19 5l-2 2 M7 17l-2 2',
  chip: 'M7 7h10v10H7z M3 9h2 M3 13h2 M19 9h2 M19 13h2 M9 3v2 M13 3v2 M9 19v2 M13 19v2',
  barcode: 'M4 5v14 M8 5v14 M12 5v14 M16 5v14 M20 5v14',
  folder: 'M3 6h6l2 2h10v10H3z',
};
function FtCatIcon({ name }) {
  return (
    <svg className="ft-cat-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={FT_ICONS[name] || FT_ICONS.folder}/>
    </svg>
  );
}

/* ============================================================
   FICHA (renderer A4 paisagem)
   ============================================================ */
function FtFichaLinha({ l }) {
  const val = l.unidade ? `${l.valor} ${l.unidade}` : l.valor;
  const longo = l.tipo === 'text' && val.length > 22;
  return longo
    ? <div className="ft-fz-line solo"><span className="ft-fz-lk2">{l.nome}</span><span className="ft-fz-lv">{val}</span></div>
    : <div className="ft-fz-line"><span className="ft-fz-lk">{l.nome}</span><span className="ft-fz-lv">{val}</span></div>;
}
function FtFichaGrupo({ g }) {
  return (
    <div className="ft-fz-grp">
      <h4>{g.nome}</h4>
      {g.linhas.map((l, i) => <FtFichaLinha l={l} key={i}/>)}
    </div>
  );
}
function FtFichaFrame({ src, legenda }) {
  return (
    <div className="ft-fz-frame">
      {src ? <img src={src} alt={legenda}/> : (
        <div className="ft-fz-ph">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="1"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          <span>{legenda}</span>
        </div>
      )}
    </div>
  );
}

/* Mede aspect ratio da maior imagem (foto > desenho) pra decidir a orientação
   da página: portrait se h > w*1.15 (produto vertical tipo porta/totem),
   senão landscape (widescreen, padrão da Vertical Parts) */
function useFichaOrientation(midia) {
  const [orientation, setOrientation] = _ftUS('landscape');
  _ftUE(() => {
    const src = (midia && (midia.foto || midia.desenho)) || null;
    if (!src) { setOrientation('landscape'); return; }
    const img = new Image();
    img.onload = () => {
      const r = img.naturalWidth / Math.max(1, img.naturalHeight);
      setOrientation(r < 0.85 ? 'portrait' : 'landscape');
    };
    img.onerror = () => setOrientation('landscape');
    img.src = src;
  }, [midia && midia.foto, midia && midia.desenho]);
  return orientation;
}

function FtFicha({ state }) {
  const d = window.FT.compile(state);
  const id = d.identificacao;
  const nome = id.nomeProduto || 'Ficha Técnica';
  const idents = [
    id.descricaoComercial && { k: 'Descrição', v: id.descricaoComercial },
    id.categoriaProduto && { k: 'Categoria', v: id.categoriaProduto },
    id.sku && { k: 'SKU', v: id.sku },
    id.codigoProduto && { k: 'Código do Produto', v: id.codigoProduto },
    id.partNumber && { k: 'Part Number', v: id.partNumber },
  ].filter(Boolean);
  const vazia = !d.grupos.length && idents.length === 0 && !(id.descricaoTecnica && id.descricaoTecnica.trim());
  const orientation = useFichaOrientation(d.temMidia ? d.midia : null);

  return (
    <div className="ft-ficha" data-orientation={orientation} data-has-media={d.temMidia ? '1' : '0'}>
      <div className="ft-fz-logo"><img src="assets/logo-verticalparts-color.png" alt="VerticalParts"/></div>
      <div className={'ft-fz-columns' + (d.temMidia ? '' : ' no-media')}>
        <div className="ft-fz-zone ft-fz-zone--text">
          <div className="ft-fz-titlebar ft-tb-yellow">Ficha de Dados : {nome}</div>
          {idents.length > 0 && (
            <div className="ft-fz-ident">
              {idents.map((it, i) => <div className="it" key={i}><span className="k">{it.k}</span><span className="v">{it.v}</span></div>)}
            </div>
          )}
          {id.descricaoTecnica && id.descricaoTecnica.trim() && (
            <div className="ft-fz-descterm">
              <span className="ft-fz-dt-k">Descrição Técnica</span>
              <p>{id.descricaoTecnica.trim()}</p>
            </div>
          )}
          {vazia ? (
            <div className="ft-fz-vazia">Selecione campos na barra lateral e preencha os valores — eles aparecem aqui automaticamente.</div>
          ) : (
            <div className="ft-fz-specs">
              {d.grupos.map((g) => <FtFichaGrupo g={g} key={g.id}/>)}
            </div>
          )}
        </div>
        {d.temMidia && (
          <div className="ft-fz-zone ft-fz-zone--media">
            <div className="ft-fz-titlebar ft-tb-black">Imagens & Desenho</div>
            <div className="ft-fz-media">
              {d.midia.desenho && <FtFichaFrame src={d.midia.desenho} legenda="Desenho técnico"/>}
              {d.midia.foto && <FtFichaFrame src={d.midia.foto} legenda="Foto do produto"/>}
            </div>
          </div>
        )}
      </div>
      <div className="ft-fz-footer">
        <div className="fb">VERTICAL<span>PARTS</span></div>
        <div className="fc">{id.categoriaProduto || 'Ficha Técnica'}</div>
        <div className="fc">{window.FT.hoje()} · www.verticalparts.com.br</div>
      </div>
    </div>
  );
}

/* ============================================================
   SIDEBAR (categorias expansíveis + busca + templates)
   ============================================================ */
function FtSidebar({ cats, search, setSearch, onToggle, onAddField, onAddCategory, onTemplate }) {
  const [open, setOpen] = _ftUS({ dimensoes: true });
  const t = search.trim().toLowerCase();
  const matchCampo = (fld) => !t || fld.nome.toLowerCase().includes(t);
  const catVisible = (c) => !t || c.nome.toLowerCase().includes(t) || c.campos.some(matchCampo);

  return (
    <aside className="ft-side">
      <div className="ft-search">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="O que você quer especificar?"/>
        {search && <button className="ft-clear" onClick={() => setSearch('')} aria-label="Limpar">×</button>}
      </div>
      <div className="ft-templates">
        <span className="ft-eyebrow">Começar de um modelo</span>
        <div className="ft-tpls">
          {window.FT.TEMPLATES.map((tp) => (
            <button key={tp.nome} onClick={() => onTemplate(tp)} title={'Carregar ' + tp.nome}>{tp.nome}</button>
          ))}
        </div>
      </div>
      <div className="ft-cats">
        {cats.filter(catVisible).map((c) => {
          const aberto = t ? true : !!open[c.id];
          const nAtivos = c.campos.filter((fld) => fld.ativo).length;
          const campos = c.campos.filter(matchCampo);
          return (
            <div className="ft-cat" key={c.id}>
              <button className="ft-cat-head" onClick={() => setOpen((o) => ({ ...o, [c.id]: !o[c.id] }))}>
                <svg className={'ft-chev' + (aberto ? ' on' : '')} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                <FtCatIcon name={c.icon}/>
                <span className="ft-cat-nome">{c.nome}</span>
                {nAtivos > 0 && <span className="ft-badge">{nAtivos}</span>}
              </button>
              {aberto && (
                <div className="ft-fields">
                  {campos.map((fld) => (
                    <label className={'ft-fld' + (fld.ativo ? ' on' : '')} key={fld.k}>
                      <input type="checkbox" checked={!!fld.ativo} onChange={() => onToggle(c.id, fld.k)}/>
                      <span className="ft-fld-nome">{fld.nome}</span>
                      {fld.unidade && <span className="ft-fld-u">{fld.unidade}</span>}
                    </label>
                  ))}
                  <button className="ft-addfield" onClick={() => onAddField(c.id)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                    Adicionar campo
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button className="ft-addcat" onClick={onAddCategory}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Nova categoria
      </button>
    </aside>
  );
}

/* ============================================================
   EDITOR (identificação + campos ativos + mídia)
   ============================================================ */
function FtValueInput({ fld, onChange }) {
  if (fld.tipo === 'date')
    return <input type="date" value={fld.valor || ''} onChange={(e) => onChange(e.target.value)}/>;
  if (fld.tipo === 'text')
    return <input type="text" value={fld.valor || ''} placeholder="valor…" onChange={(e) => onChange(e.target.value)}/>;
  return (
    <div className={fld.unidade ? 'ft-unit' : ''}>
      <input type="text" inputMode="decimal" value={fld.valor || ''} placeholder="valor…" onChange={(e) => onChange(e.target.value)}/>
      {fld.unidade && <span className="u">{fld.unidade}</span>}
    </div>
  );
}

function FtMediaSlot({ label, src, onPick, onClear }) {
  const id = 'ft-media-' + label.replace(/\s/g, '');
  return (
    <div className="ft-media-slot">
      <span className="ft-media-lbl">{label}</span>
      {src ? (
        <div className="ft-media-has">
          <img src={src} alt={label}/>
          <button className="ft-media-rm" onClick={onClear}>Remover</button>
        </div>
      ) : (
        <label className="ft-media-drop" htmlFor={id}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/></svg>
          <span>Enviar imagem</span>
          <input id={id} type="file" accept="image/*" hidden onChange={onPick}/>
        </label>
      )}
    </div>
  );
}

function FtEditor({ state, onIdent, onValue, onRemove, onMedia, onAddField }) {
  const grupos = state.cats
    .map((c) => ({ c, ativos: c.campos.filter((fld) => fld.ativo).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)) }))
    .filter((g) => g.ativos.length);

  return (
    <div className="ft-editor">
      <section className="ft-card">
        <div className="ft-card-head"><span className="ft-bar"></span><h3>Identificação</h3></div>
        <div className="ft-grid">
          <label className="ft-f full"><span>Descrição comercial</span>
            <input value={state.identificacao.descricaoComercial} onChange={(e) => onIdent('descricaoComercial', e.target.value)} placeholder="descrição amigável para leigos"/>
          </label>
          <label className="ft-f full"><span>Descrição técnica</span>
            <textarea rows="2" value={state.identificacao.descricaoTecnica || ''} onChange={(e) => onIdent('descricaoTecnica', e.target.value)} placeholder="especificação técnica detalhada do produto…"></textarea>
          </label>
          <label className="ft-f"><span>Categoria / Segmento</span>
            <input value={state.identificacao.categoriaProduto} onChange={(e) => onIdent('categoriaProduto', e.target.value)} placeholder="Automotivo, Madeira, Elétrico…"/>
          </label>
          <label className="ft-f"><span>SKU</span>
            <input className="ft-mono" value={state.identificacao.sku} onChange={(e) => onIdent('sku', e.target.value)} placeholder="opcional"/>
          </label>
          <label className="ft-f"><span>Part Number</span>
            <input className="ft-mono" value={state.identificacao.partNumber} onChange={(e) => onIdent('partNumber', e.target.value)} placeholder="opcional"/>
          </label>
          <label className="ft-f"><span>Código do Produto</span>
            <input className="ft-mono" value={state.identificacao.codigoProduto || ''} onChange={(e) => onIdent('codigoProduto', e.target.value)} placeholder="ex.: VPMP-242"/>
          </label>
        </div>
      </section>

      {grupos.length === 0 && (
        <div className="ft-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3 8-8"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <p><strong>Monte sua ficha.</strong> Abra uma categoria na barra lateral e marque os campos que se aplicam ao seu produto. Eles aparecem aqui para preencher.</p>
        </div>
      )}

      {grupos.map(({ c, ativos }) => (
        <section className="ft-card" key={c.id}>
          <div className="ft-card-head"><span className="ft-bar"></span><h3>{c.nome}</h3>
            <button className="ft-card-add" onClick={() => onAddField(c.id)} title="Adicionar campo a esta categoria">+ campo</button>
          </div>
          <div className="ft-rows">
            {ativos.map((fld) => (
              <div className="ft-row" key={fld.k}>
                <span className="ft-row-lbl">{fld.nome}</span>
                <div className="ft-row-val"><FtValueInput fld={fld} onChange={(v) => onValue(c.id, fld.k, v)}/></div>
                <button className="ft-row-rm" onClick={() => onRemove(c.id, fld.k)} title="Remover" aria-label="Remover">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="ft-card">
        <div className="ft-card-head"><span className="ft-bar"></span><h3>Imagens & Desenho</h3></div>
        <div className="ft-media">
          <FtMediaSlot label="Desenho técnico" src={state.midia.desenho} onPick={(e) => onMedia('desenho', e)} onClear={() => onMedia('desenho', null)}/>
          <FtMediaSlot label="Foto do produto"  src={state.midia.foto}    onPick={(e) => onMedia('foto', e)}    onClear={() => onMedia('foto', null)}/>
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   MODALS — Add Field / Add Category
   ============================================================ */
function FtModalShell({ titulo, onClose, children }) {
  return (
    <div className="ft-gm-overlay" onClick={(e) => { if (e.target.classList.contains('ft-gm-overlay')) onClose(); }}>
      <div className="ft-gm-card">
        <div className="ft-gm-head"><h3>{titulo}</h3><button className="ft-gm-x" onClick={onClose} aria-label="Fechar">×</button></div>
        {children}
      </div>
    </div>
  );
}
function FtAddFieldModal({ catNome, onAdd, onClose }) {
  const [nome, setNome] = _ftUS('');
  const [tipo, setTipo] = _ftUS('number');
  const [unidade, setUnidade] = _ftUS('');
  const [unidadeCustom, setUnidadeCustom] = _ftUS('');
  const [valor, setValor] = _ftUS('');
  const uFinal = unidade === '__outra__' ? unidadeCustom : unidade;
  const submit = () => {
    if (!nome.trim()) return;
    onAdd({ nome: nome.trim(), tipo, unidade: tipo === 'text' || tipo === 'date' ? '' : uFinal, valor: valor.trim() });
  };
  return (
    <FtModalShell titulo={'Adicionar campo · ' + catNome} onClose={onClose}>
      <div className="ft-gm-body">
        <label className="ft-gm-field"><span>Nome do campo <i>*</i></span>
          <input autoFocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex.: Bitola, Tipo de Madeira"/>
        </label>
        <div className="ft-gm-row">
          <label className="ft-gm-field"><span>Tipo de entrada</span>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="number">Número</option>
              <option value="text">Texto</option>
              <option value="date">Data</option>
            </select>
          </label>
          {tipo === 'number' && (
            <label className="ft-gm-field"><span>Unidade / Símbolo</span>
              <select value={unidade} onChange={(e) => setUnidade(e.target.value)}>
                <option value="">— nenhuma —</option>
                {window.FT.UNIDADES.filter((u) => u && u !== '—').map((u) => <option key={u} value={u}>{u}</option>)}
                <option value="__outra__">outra…</option>
              </select>
            </label>
          )}
        </div>
        {tipo === 'number' && unidade === '__outra__' && (
          <label className="ft-gm-field"><span>Nova unidade</span>
            <input value={unidadeCustom} onChange={(e) => setUnidadeCustom(e.target.value)} placeholder="ex.: cm³, lúmen"/>
          </label>
        )}
        <label className="ft-gm-field"><span>Valor padrão (opcional)</span>
          <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="deixe vazio p/ preencher depois"/>
        </label>
      </div>
      <div className="ft-gm-foot">
        <button className="ft-btn ghost" onClick={onClose}>Cancelar</button>
        <button className="ft-btn primary" onClick={submit}>Adicionar campo</button>
      </div>
    </FtModalShell>
  );
}
function FtAddCategoryModal({ onAdd, onClose }) {
  const [nome, setNome] = _ftUS('');
  return (
    <FtModalShell titulo="Nova categoria" onClose={onClose}>
      <div className="ft-gm-body">
        <label className="ft-gm-field"><span>Nome da categoria <i>*</i></span>
          <input autoFocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex.: Especificações de Madeira"/>
        </label>
        <p className="ft-gm-hint">A categoria aparece na barra lateral; depois você adiciona campos a ela.</p>
      </div>
      <div className="ft-gm-foot">
        <button className="ft-btn ghost" onClick={onClose}>Cancelar</button>
        <button className="ft-btn primary" onClick={() => nome.trim() && onAdd(nome.trim())}>Criar categoria</button>
      </div>
    </FtModalShell>
  );
}

/* ============================================================
   GENERATOR (wizard universal) — sub-componente da página
   ============================================================ */
function FtGenerator({ initial, onSaved, onCancel }) {
  const [state, setState] = _ftUS(initial || window.FT.freshState());
  const [search, setSearch] = _ftUS('');
  const [modal, setModal] = _ftUS(null);
  const [overlay, setOverlay] = _ftUS(false);
  const [saving, setSaving] = _ftUS(false);
  const previewWrap = _ftUR(null);
  const [scale, setScale] = _ftUS(0.42);

  _ftUE(() => {
    const el = previewWrap.current; if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.max(0.2, Math.min(1, (el.clientWidth - 28) / 1040))));
    ro.observe(el); return () => ro.disconnect();
  }, []);

  const setIdent = (k, v) => setState((s) => ({ ...s, identificacao: { ...s.identificacao, [k]: v } }));
  const toggleField = (catId, key) => setState((s) => {
    const ord = window.FT.nextOrdem(s.cats);
    return { ...s, cats: s.cats.map((c) => c.id !== catId ? c : { ...c, campos: c.campos.map((fld) => fld.k !== key ? fld : { ...fld, ativo: !fld.ativo, ordem: !fld.ativo ? ord : fld.ordem }) }) };
  });
  const setValue = (catId, key, v) => setState((s) => ({ ...s, cats: s.cats.map((c) => c.id !== catId ? c : { ...c, campos: c.campos.map((fld) => fld.k !== key ? fld : { ...fld, valor: v }) }) }));
  const removeField = (catId, key) => setState((s) => ({ ...s, cats: s.cats.map((c) => c.id !== catId ? c : { ...c, campos: c.campos.map((fld) => fld.k !== key ? fld : { ...fld, ativo: false }) }) }));
  const addField = (catId, def) => setState((s) => {
    const ord = window.FT.nextOrdem(s.cats);
    const novo = { k: window.FT.slug(def.nome), nome: def.nome, unidade: def.unidade || '', tipo: def.tipo || 'number', valor: def.valor || '', ativo: true, ordem: ord, custom: true };
    return { ...s, cats: s.cats.map((c) => c.id !== catId ? c : { ...c, campos: [...c.campos, novo] }) };
  });
  const addCategory = (nome) => { const id = window.FT.slug(nome); setState((s) => ({ ...s, cats: [...s.cats, { id, nome, icon: 'folder', custom: true, campos: [] }] })); setModal(null); };
  const onMedia = (slot, e) => {
    if (e === null) { setState((s) => ({ ...s, midia: { ...s.midia, [slot]: null } })); return; }
    const file = e.target.files && e.target.files[0]; if (!file) return;
    const r = new FileReader(); r.onload = () => setState((s) => ({ ...s, midia: { ...s.midia, [slot]: r.result } })); r.readAsDataURL(file);
  };
  const aplicarTemplate = (tp) => setState((s) => window.FT.aplicarTemplate(s, tp));

  const podeGerar = window.FT.podeGerar(state);

  const handleSalvar = async () => {
    if (!podeGerar || saving) return;
    setSaving(true);
    try {
      const rec = initial && initial.__id
        ? await window.FTStore.update(initial.__id, state)
        : await window.FTStore.createDraft(state);
      onSaved && onSaved(rec);
    } catch (e) {
      alert('Erro ao salvar ficha: ' + (e.message || e));
    } finally { setSaving(false); }
  };

  return (
    <div className="ft-gen-shell">
      <div className="ft-namebar">
        <label className="ft-name">
          <span>Nome do produto <i>*</i></span>
          <input value={state.identificacao.nomeProduto} onChange={(e) => setIdent('nomeProduto', e.target.value)} placeholder="ex.: Pneu, Caibro, Rolamento, Máquina de Tração…"/>
        </label>
        <button className="ft-btn ghost" onClick={onCancel}>Cancelar</button>
        <button className={'ft-btn primary' + (podeGerar ? '' : ' off')} disabled={!podeGerar || saving} onClick={handleSalvar}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          {saving ? 'Salvando…' : 'Salvar ficha'}
        </button>
        <button className={'ft-btn dark' + (podeGerar ? '' : ' off')} disabled={!podeGerar} onClick={() => setOverlay(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>
          Gerar PDF
        </button>
      </div>

      <div className="ft-gen-body">
        <FtSidebar cats={state.cats} search={search} setSearch={setSearch}
          onToggle={toggleField}
          onAddField={(catId) => setModal({ tipo: 'field', catId })}
          onAddCategory={() => setModal({ tipo: 'cat' })}
          onTemplate={aplicarTemplate}/>
        <div className="ft-work">
          <FtEditor state={state} onIdent={setIdent} onValue={setValue} onRemove={removeField}
            onMedia={onMedia} onAddField={(catId) => setModal({ tipo: 'field', catId })}/>
        </div>
        <div className="ft-previewcol">
          <div className="ft-preview-head"><span>Pré-visualização</span><em>compila só o preenchido</em></div>
          <div className="ft-preview-wrap" ref={previewWrap}>
            <div className="ft-preview-scaler" style={{ zoom: scale }}><FtFicha state={state}/></div>
          </div>
        </div>
      </div>

      {modal && modal.tipo === 'field' && (
        <FtAddFieldModal catNome={state.cats.find((c) => c.id === modal.catId)?.nome || ''}
          onAdd={(def) => { addField(modal.catId, def); setModal(null); }}
          onClose={() => setModal(null)}/>
      )}
      {modal && modal.tipo === 'cat' && (
        <FtAddCategoryModal onAdd={addCategory} onClose={() => setModal(null)}/>
      )}

      {overlay && ReactDOM.createPortal(
        <div className="ft-ficha-overlay" onClick={(e) => { if (e.target.classList.contains('ft-ficha-overlay')) setOverlay(false); }}>
          <div className="ft-fo-bar">
            <span>Ficha Técnica — {state.identificacao.nomeProduto}</span>
            <div className="ft-fo-actions">
              <button className="ft-btn primary" onClick={async () => {
                // SALVAR PDF DIRETO — gera o arquivo sem caixa de impressão.
                // html2pdf renderiza o nó como canvas e empacota em PDF A4.
                if (!window.html2pdf) { alert('Biblioteca PDF ainda carregando…'); return; }
                const fichaEl = document.querySelector('.ft-ficha-overlay .ft-ficha');
                if (!fichaEl) return;
                const ori = fichaEl.getAttribute('data-orientation') || 'landscape';
                const safeName = (state.identificacao.nomeProduto || 'ficha-tecnica')
                  .normalize('NFD').replace(/[̀-ͯ]/g, '')
                  .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
                const opt = {
                  margin: 0,
                  filename: `Ficha-${safeName}.pdf`,
                  image: { type: 'jpeg', quality: 0.97 },
                  html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false },
                  jsPDF: { unit: 'mm', format: 'a4', orientation: ori, compress: true }
                };
                try {
                  await window.html2pdf().set(opt).from(fichaEl).save();
                } catch (err) {
                  console.error('html2pdf error', err);
                  alert('Erro ao gerar PDF: ' + (err.message || err));
                }
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Salvar PDF
              </button>
              <button className="ft-btn dark" onClick={() => {
                // Imprimir/visualizar via navegador. Injeta @page conforme orientação.
                const ficha = document.querySelector('.ft-ficha-overlay .ft-ficha');
                const ori = (ficha && ficha.getAttribute('data-orientation')) || 'landscape';
                let inj = document.getElementById('__ft-print-page');
                if (inj) inj.remove();
                inj = document.createElement('style');
                inj.id = '__ft-print-page';
                inj.textContent = '@page { size: A4 ' + ori + '; margin: 0; }';
                document.head.appendChild(inj);
                setTimeout(() => window.print(), 60);
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>
                Imprimir
              </button>
              <button className="ft-btn ghost" onClick={() => setOverlay(false)}>Fechar</button>
            </div>
          </div>
          <div className="ft-fo-scroll"><FtFicha state={state}/></div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ============================================================
   DASHBOARD — listagem das fichas
   ============================================================ */
function FtDashboard({ onNew, onOpen }) {
  const [fichas, setFichas] = _ftUS([]);
  const [loading, setLoading] = _ftUS(true);
  const [query, setQuery] = _ftUS('');

  const refresh = async () => {
    setLoading(true);
    const list = await window.FTStore.listAll();
    setFichas(list);
    setLoading(false);
  };
  _ftUE(() => { refresh(); }, []);

  const filtered = fichas.filter((f) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return ((f.numero_documento || '') + ' ' + (f.nome_produto || '') + ' ' + (f.categoria_produto || '') + ' ' + (f.sku || '') + ' ' + (f.codigo_produto || ''))
      .toLowerCase().includes(q);
  });

  const handleDel = async (id) => {
    if (!window.confirm('Excluir esta ficha? O produto vinculado no Catálogo também será removido.')) return;
    await window.FTStore.remove(id);
    refresh();
  };

  return (
    <div className="ft-dash">
      <div className="ft-dash-stats">
        <div className="ft-stat">
          <div className="ft-stat-num">{fichas.length}</div>
          <div className="ft-stat-label">Fichas totais</div>
        </div>
        <div className="ft-stat">
          <div className="ft-stat-num">{new Set(fichas.map((f) => f.categoria_produto).filter(Boolean)).size}</div>
          <div className="ft-stat-label">Categorias distintas</div>
        </div>
        <div className="ft-stat">
          <div className="ft-stat-num">{fichas.filter((f) => f.produto_id).length}</div>
          <div className="ft-stat-label">Vinculadas no Catálogo</div>
        </div>
      </div>

      <div className="ft-panel">
        <div className="ft-panel-head">
          <h2>Todas as fichas</h2>
          <div className="ft-panel-actions">
            <input className="ft-panel-search" placeholder="Buscar nº, produto, SKU…" value={query} onChange={(e) => setQuery(e.target.value)}/>
            <button className="ft-btn primary" onClick={onNew}>+ Nova ficha</button>
          </div>
        </div>
        {loading ? (
          <div className="ft-empty-row">Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="ft-empty-row">Nenhuma ficha {query ? 'que combine com a busca' : 'ainda'}. Crie a primeira.</div>
        ) : (
          <table className="ft-table">
            <thead>
              <tr><th>Ficha</th><th>Produto</th><th>Categoria</th><th>SKU</th><th>Criada</th><th style={{textAlign:'right'}}>Ações</th></tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id}>
                  <td><div className="ft-cell-num">{f.numero_documento}</div></td>
                  <td><div className="ft-cell-prod">{f.nome_produto}</div><div className="ft-cell-sub">{f.descricao_comercial || '—'}</div></td>
                  <td>{f.categoria_produto || '—'}</td>
                  <td className="ft-cell-mono">{f.sku || f.codigo_produto || '—'}</td>
                  <td className="ft-cell-time">{window.FTStore.relative(f.criado_em)}</td>
                  <td style={{textAlign:'right'}}>
                    <button className="ft-mini-btn" onClick={() => onOpen(f)}>Abrir</button>
                    <button className="ft-mini-btn ft-mini-btn--danger" onClick={() => handleDel(f.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   PAGE — abas Painel / Nova ficha
   ============================================================ */
function FichaTecnicaPage() {
  const [view, setView] = _ftUS('painel'); // painel | nova
  const [initial, setInitial] = _ftUS(null);

  const handleOpen = (ficha) => {
    setInitial({
      __id: ficha.id,
      identificacao: ficha.identificacao || {},
      cats: ficha.cats || window.FT.freshCats(),
      midia: ficha.midia || { desenho: null, foto: null },
    });
    setView('nova');
  };

  return (
    <div className="ci-page">
      <div className="ci-page-head">
        <div className="ci-page-titles">
          <div className="ci-page-kicker">ENGENHARIA · FICHA TÉCNICA</div>
          <h1 className="ci-page-title">FICHA TÉCNICA</h1>
          <p className="ci-page-sub">Gerador universal de fichas técnicas · cria automaticamente uma entrada no Catálogo de Produtos</p>
        </div>
        <div className="ci-page-actions-wrap">
          <div className="ci-page-actions">
            <button className={'ci-tab' + (view === 'painel' ? ' on' : '')} onClick={() => { setView('painel'); setInitial(null); }}>▦ Painel</button>
            <button className={'ci-tab' + (view === 'nova' ? ' on' : '')} onClick={() => { setView('nova'); setInitial(null); }}>+ Nova ficha</button>
          </div>
        </div>
      </div>
      <div className="ci-page-body">
        {view === 'painel'
          ? <FtDashboard onNew={() => { setInitial(null); setView('nova'); }} onOpen={handleOpen}/>
          : <FtGenerator initial={initial} onSaved={() => { setView('painel'); setInitial(null); }} onCancel={() => { setView('painel'); setInitial(null); }}/>}
      </div>
    </div>
  );
}

window.FichaTecnicaPage = FichaTecnicaPage;
