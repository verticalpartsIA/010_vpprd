/* ============================================================
   ficha-workflow.jsx — UI do funil de pré-venda por setores.
   - FwIconBar: 5 ícones (lápis · arquivar · lixeira · carimbo · olhinho) + Publicar
   - FwWorkflowCard: stepper + handoff + cliente lead + revisão
   - FwTimelineModal: histórico append-only (olhinho)
   Montado no painel do produto do Catálogo (ncm-catalogo.jsx).
   Depende de window.FWF, window.FWFStore, primitives, toast.
   ============================================================ */
const { useState: _fwUS, useEffect: _fwUE, useCallback: _fwUC } = React;

function fwRole() {
  try { return JSON.parse(localStorage.getItem('vpprd.role')) || 'admin'; }
  catch (e) { return 'admin'; }
}

const FW_ACAO_LABEL = {
  criou: 'criou a ficha', editou: 'editou a ficha',
  avancou: 'avançou a etapa', devolveu: 'devolveu a etapa',
  revisao: 'solicitou revisão', revisao_ok: 'concluiu a revisão',
  arquivou: 'arquivou o produto', desarquivou: 'desarquivou o produto',
  excluiu: 'excluiu', publicou: 'publicou o produto',
  cliente_lead: 'atualizou dados do cliente',
};
const FW_ACAO_ICON = {
  criou: 'plus', editou: 'edit', avancou: 'arrowRight', devolveu: 'reply',
  revisao: 'signature', revisao_ok: 'check', arquivou: 'layers',
  desarquivou: 'layers', excluiu: 'trash', publicou: 'upload', cliente_lead: 'user',
};

/* ---------- Olhinho: timeline do histórico ---------- */
function FwTimelineModal({ ficha, produto, onClose }) {
  const [rows, setRows] = _fwUS(null);
  _fwUE(() => {
    window.FWFStore.historico(ficha && ficha.id, produto && produto.id).then(setRows);
  }, []);

  return (
    <Modal title={`Histórico — ${(ficha && ficha.numero_documento) || (produto && produto.codigo) || ''}`} onClose={onClose} width={560}
      footer={<Button variant="ghost" onClick={onClose}>Fechar</Button>}>
      {rows === null
        ? <div className="muted small" style={{ padding: '20px 0', textAlign: 'center' }}>Carregando…</div>
        : rows.length === 0
          ? <div className="muted small" style={{ padding: '20px 0', textAlign: 'center' }}>Nenhum registro ainda. Toda ação a partir de agora fica gravada aqui.</div>
          : (
            <div className="fw-timeline">
              {rows.map((r) => {
                const Ico = Icon[FW_ACAO_ICON[r.acao] || 'clock'] || Icon.clock;
                const de = r.de_etapa && window.FWF.etapa(r.de_etapa);
                const para = r.para_etapa && window.FWF.etapa(r.para_etapa);
                const mudouEtapa = r.de_etapa && r.para_etapa && r.de_etapa !== r.para_etapa;
                return (
                  <div className="fw-tl-item" key={r.id}>
                    <div className="fw-tl-ico"><Ico size={12}/></div>
                    <div className="fw-tl-body">
                      <div className="fw-tl-line">
                        <b>{r.ator_nome}</b>
                        {r.ator_setor && r.ator_setor !== 'admin' && <span className="fw-tl-setor">{window.FWF.setor(r.ator_setor).label}</span>}
                        &nbsp;{FW_ACAO_LABEL[r.acao] || r.acao}
                      </div>
                      {mudouEtapa && <div className="fw-tl-move">{de.label} <span>→</span> {para.label}</div>}
                      {r.detalhe && r.detalhe.motivo && <div className="fw-tl-det">“{r.detalhe.motivo}”</div>}
                      <div className="fw-tl-when">{window.FWFStore.fmtDateTime(r.criado_em)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
    </Modal>
  );
}

/* ---------- Carimbinho: solicitar revisão ---------- */
function FwRevisaoModal({ ficha, onClose, onDone }) {
  const [motivo, setMotivo] = _fwUS('');
  const [busy, setBusy] = _fwUS(false);
  const enviar = async () => {
    setBusy(true);
    try {
      const upd = await window.FWFStore.solicitarRevisao(ficha, motivo.trim(), window.FWFStore.atorAtual(fwRole()));
      window.toast('Revisão solicitada — Engenharia notificada.', 'success');
      onDone(upd);
    } catch (e) { window.toast('Erro: ' + e.message, 'error'); }
    finally { setBusy(false); }
  };
  return (
    <Modal title="Solicitar revisão da ficha" onClose={onClose} width={460}
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={busy}>Cancelar</Button>
        <Button variant="primary" icon="signature" onClick={enviar} disabled={busy}>{busy ? 'Enviando…' : 'Solicitar revisão'}</Button>
      </>}>
      <p className="small muted" style={{ marginTop: 0 }}>
        Marca a ficha como “em revisão” e notifica a Engenharia. O pedido fica gravado no histórico.
      </p>
      <label className="up-eyebrow muted">Motivo (opcional)</label>
      <textarea className="input" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)}
        placeholder="ex.: medida divergente do datasheet do fabricante…" style={{ resize: 'vertical', fontFamily: 'inherit', marginTop: 4 }}/>
    </Modal>
  );
}

/* ---------- Cliente lead (vendedor coleta nome + WhatsApp) ---------- */
function FwLeadModal({ ficha, onClose, onDone }) {
  const lead = ficha.cliente_lead || {};
  const [nome, setNome] = _fwUS(lead.nome || '');
  const [whats, setWhats] = _fwUS(lead.whatsapp || '');
  const [obs, setObs] = _fwUS(lead.observacao || '');
  const [busy, setBusy] = _fwUS(false);
  const salvar = async () => {
    setBusy(true);
    try {
      const upd = await window.FWFStore.salvarClienteLead(ficha, { nome, whatsapp: whats, observacao: obs }, window.FWFStore.atorAtual(fwRole()));
      window.toast('Dados do cliente salvos.', 'success');
      onDone(upd);
    } catch (e) { window.toast('Erro: ' + e.message, 'error'); }
    finally { setBusy(false); }
  };
  return (
    <Modal title="Cliente interessado (lead)" onClose={onClose} width={460}
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={busy}>Cancelar</Button>
        <Button variant="primary" icon="check" onClick={salvar} disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</Button>
      </>}>
      <div className="stack" style={{ gap: 10 }}>
        <div className="stack" style={{ gap: 4 }}><label className="up-eyebrow muted">Nome do cliente</label>
          <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex.: Elevadores Silva Ltda."/></div>
        <div className="stack" style={{ gap: 4 }}><label className="up-eyebrow muted">WhatsApp</label>
          <input className="input" value={whats} onChange={(e) => setWhats(e.target.value)} placeholder="(11) 99999-0000"/></div>
        <div className="stack" style={{ gap: 4 }}><label className="up-eyebrow muted">Observação</label>
          <textarea className="input" rows={2} value={obs} onChange={(e) => setObs(e.target.value)}
            placeholder="O que o cliente pediu, urgência, contexto…" style={{ resize: 'vertical', fontFamily: 'inherit' }}/></div>
      </div>
    </Modal>
  );
}

/* ---------- Stepper compacto (9 etapas) ---------- */
function FwStepper({ etapaId }) {
  const atual = window.FWF.etapa(etapaId);
  return (
    <div className="fw-stepper">
      {window.FWF.ETAPAS.map((e) => {
        const cls = e.n < atual.n ? 'done' : e.n === atual.n ? 'current' : 'todo';
        const s = window.FWF.setor(e.setor);
        return (
          <div className={'fw-step ' + cls} key={e.id} title={`${e.n}. ${e.label} — ${s.label}`}>
            <div className="fw-step-dot" style={cls !== 'todo' ? { background: s.cor, borderColor: s.cor } : null}>
              {cls === 'done' ? '✓' : e.n}
            </div>
            {e.n < 9 && <div className={'fw-step-bar' + (cls === 'done' ? ' on' : '')}/>}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Card do workflow (dentro do painel do produto) ---------- */
function FwWorkflowCard({ ficha, onChanged }) {
  const role = fwRole();
  const [busy, setBusy] = _fwUS(false);
  const [showLead, setShowLead] = _fwUS(false);

  if (!ficha) return null;
  const etapaId = ficha.etapa || 'comercial_rascunho';
  const etapa = window.FWF.etapa(etapaId);
  const setorVez = window.FWF.setor(window.FWF.setorResponsavel(etapaId));
  const trans = window.FWF.transicoes(etapaId);
  const posso = window.FWF.podeAgir(role, etapaId);
  const lead = ficha.cliente_lead || null;

  const mover = async (t) => {
    if (busy) return;
    setBusy(true);
    try {
      const upd = await window.FWFStore.transicao(ficha, t.para, window.FWFStore.atorAtual(role), t.acao);
      window.toast(`Etapa movida: ${window.FWF.etapa(t.para).label} (${window.FWF.setor(window.FWF.setorResponsavel(t.para)).label}).`, 'success');
      onChanged(upd);
    } catch (e) { window.toast('Erro: ' + e.message, 'error'); }
    finally { setBusy(false); }
  };

  const resolverRevisao = async () => {
    const upd = await window.FWFStore.limparRevisao(ficha, window.FWFStore.atorAtual(role));
    window.toast('Revisão concluída.', 'success');
    onChanged(upd);
  };

  return (
    <div className="fw-card">
      <div className="row sb" style={{ alignItems: 'center' }}>
        <span className="up-eyebrow muted">Fluxo de pré-venda</span>
        <span className="fw-setor-badge" style={{ background: setorVez.cor }}>{setorVez.label}</span>
      </div>

      {ficha.revisao && (
        <div className="fw-revisao-banner">
          <Icon.signature size={12}/>
          <span>Revisão solicitada por <b>{ficha.revisao.solicitada_por}</b>{ficha.revisao.motivo ? ` — “${ficha.revisao.motivo}”` : ''}</span>
          {(role === 'engenharia' || role === 'admin') &&
            <button className="fw-rev-ok" onClick={resolverRevisao}>Concluir</button>}
        </div>
      )}

      <FwStepper etapaId={etapaId}/>
      <div className="fw-etapa-now">
        <b>{etapa.n}/9 · {etapa.label}</b>
        <span>{etapa.desc}</span>
      </div>

      <div className="fw-lead" onClick={() => setShowLead(true)} title="Editar dados do cliente">
        <Icon.user size={11}/>
        {lead && lead.nome
          ? <span><b>{lead.nome}</b>{lead.whatsapp ? ` · ${lead.whatsapp}` : ''}</span>
          : <span className="muted">Cliente interessado: clique p/ informar (nome + WhatsApp)</span>}
      </div>

      {etapaId !== 'publicado' && (
        posso ? (
          <div className="row gap-2" style={{ flexWrap: 'wrap', marginTop: 8 }}>
            {trans.avancar && <Button variant="primary" size="sm" icon="arrowRight" onClick={() => mover(trans.avancar)} disabled={busy}>{trans.avancar.label}</Button>}
            {trans.devolver && <Button variant="ghost" size="sm" icon="reply" onClick={() => mover(trans.devolver)} disabled={busy}>{trans.devolver.label}</Button>}
          </div>
        ) : (
          <div className="fw-wait">Aguardando <b>{setorVez.label}</b> — seu perfil ({window.FWF.setor(role).label || role}) não age nesta etapa.</div>
        )
      )}
      {etapaId === 'publicado' && <div className="fw-pub-ok"><Icon.check size={12}/> Produto publicado.</div>}

      {showLead && <FwLeadModal ficha={ficha} onClose={() => setShowLead(false)} onDone={(f) => { setShowLead(false); onChanged(f); }}/>}
    </div>
  );
}

/* ---------- Barra de ícones (cabeçalho do painel do produto) ---------- */
function FwIconBar({ produto, ficha, onEdit, onDelete, onChanged }) {
  const role = fwRole();
  const [showTl, setShowTl] = _fwUS(false);
  const [showRev, setShowRev] = _fwUS(false);

  const arquivar = async () => {
    const on = !produto.arquivado;
    if (!window.confirm(on
      ? `Arquivar "${produto.denominacao || produto.codigo}"?\nSome do catálogo ativo, mas nada é apagado — dá pra desarquivar depois.`
      : `Desarquivar "${produto.denominacao || produto.codigo}" e devolvê-lo ao catálogo ativo?`)) return;
    try {
      await window.FWFStore.arquivarProduto(produto, ficha, on, window.FWFStore.atorAtual(role));
      window.toast(on ? 'Produto arquivado.' : 'Produto desarquivado.', 'success');
      onChanged();
    } catch (e) { window.toast('Erro: ' + e.message, 'error'); }
  };

  const publicar = async () => {
    if (!ficha) return window.toast('Produto sem ficha técnica vinculada.', 'warning');
    if (ficha.etapa === 'publicado') return window.toast('Já publicado.', 'info');
    if (!window.confirm('Marcar como PUBLICADO?\n\nO cadastro automático no Omie (API) entra na Fase 2 — por enquanto este botão registra a publicação no fluxo e no histórico.')) return;
    try {
      const upd = await window.FWFStore.transicao(ficha, 'publicado', window.FWFStore.atorAtual(role), 'publicou');
      window.toast('Produto marcado como publicado.', 'success');
      onChanged(upd);
    } catch (e) { window.toast('Erro: ' + e.message, 'error'); }
  };

  const IconBtn = ({ icon, title, onClick, danger }) => {
    const I = Icon[icon] || Icon.more;
    return (
      <button className={'fw-icon-btn' + (danger ? ' danger' : '')} title={title} onClick={onClick}>
        <I size={13}/>
      </button>
    );
  };

  return (
    <>
      <div className="fw-iconbar">
        <IconBtn icon="edit" title="Editar — abre a ficha técnica" onClick={onEdit}/>
        <IconBtn icon="layers" title={produto.arquivado ? 'Desarquivar produto' : 'Arquivar produto (some do catálogo ativo, reversível)'} onClick={arquivar}/>
        <IconBtn icon="trash" title="Excluir definitivamente" onClick={onDelete} danger/>
        <IconBtn icon="signature" title="Solicitar revisão da ficha técnica" onClick={() => ficha ? setShowRev(true) : window.toast('Produto sem ficha vinculada.', 'warning')}/>
        <IconBtn icon="eye" title="Histórico de alterações (quem fez, quando)" onClick={() => setShowTl(true)}/>
        <Button variant="primary" size="sm" icon="upload" onClick={publicar}
          disabled={!ficha || (ficha.etapa !== 'importacao' && ficha.etapa !== 'publicado' && role !== 'admin')}>
          Publicar
        </Button>
      </div>
      {showTl && <FwTimelineModal ficha={ficha} produto={produto} onClose={() => setShowTl(false)}/>}
      {showRev && <FwRevisaoModal ficha={ficha} onClose={() => setShowRev(false)} onDone={(f) => { setShowRev(false); onChanged(f); }}/>}
    </>
  );
}

window.FwWorkflowCard = FwWorkflowCard;
window.FwIconBar = FwIconBar;
window.FwTimelineModal = FwTimelineModal;
