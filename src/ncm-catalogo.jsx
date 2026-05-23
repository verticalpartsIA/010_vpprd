/* ============================================================
   ncm-catalogo.jsx — Catálogo de Produtos (Logística)
   Lista cadastrados + painel lateral com abas
   ============================================================ */

function NcmCatalogoPage({ setRoute }) {
  const N = window.__VP_NCM;
  const [filter, setFilter] = React.useState("Todos");
  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState(N.produtos[0].id);
  const [detailTab, setDetailTab] = React.useState("dados");

  const filters = ["Todos", "CADASTRADO", "APROVADO", "AGUARD_JURIDICO", "EM_PREENCHIMENTO", "DESATIVADO"];

  const stats = {
    ativos: N.produtos.filter(p => p.status === "CADASTRADO").length,
    juridico: N.produtos.filter(p => p.status === "AGUARD_JURIDICO").length,
    preench: N.produtos.filter(p => p.status === "EM_PREENCHIMENTO").length,
    ncms: new Set(N.produtos.filter(p => p.ncm).map(p => p.ncm)).size,
  };

  const rows = N.produtos.filter(p => {
    if (filter !== "Todos" && p.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(p.denominacao + (p.ncm || "") + p.id + (p.siscomex || "")).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const selected = N.produtos.find(p => p.id === selectedId);

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div className="page-head__l">
          <div className="page-head__eyebrow"><span className="vp-rule"/>Logística · Catálogo de Produtos</div>
          <h1 className="page-head__title">Catálogo de Produtos</h1>
          <p className="page-head__sub">Produtos cadastrados no Catálogo da Receita Federal (Siscomex/Duimp). Necessário para emissão de Duimp.</p>
        </div>
        <div className="page-head__r">
          <Button variant="outline" icon="download" onClick={() => window.toast("Exportação CSV em breve", "info")}>Exportar</Button>
          <Button variant="primary" icon="plus" onClick={() => setRoute("ncm-kanban")}>Novo produto</Button>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <KPI label="Produtos ativos" value={stats.ativos} sub="cadastrados Siscomex" icon="package"/>
        <KPI label="Aguard. jurídico" value={stats.juridico} sub="em validação" icon="scale"/>
        <KPI label="Em preenchimento" value={stats.preench} sub="rascunhos" icon="edit"/>
        <KPI label="NCMs distintas" value={stats.ncms} sub="códigos em uso" icon="globe"/>
      </div>

      <div className="tbar">
        <div className="seg">
          {filters.map(s => (
            <button key={s} className={filter === s ? "is-active" : ""} onClick={() => setFilter(s)}>
              {s === "Todos" ? "Todos" :
               s === "CADASTRADO" ? "Ativos" :
               s === "APROVADO" ? "Aprovados" :
               s === "AGUARD_JURIDICO" ? "Aguard. jurídico" :
               s === "EM_PREENCHIMENTO" ? "Em preench." :
               "Desativados"}
            </button>
          ))}
        </div>
        <div className="divider-v"/>
        <Button variant="outline" size="sm" icon="filter">NCM</Button>
        <Button variant="outline" size="sm" icon="filter">Fabricante</Button>
        <div className="spacer"/>
        <div className="search">
          <Icon.search size={12} color="var(--fg3)"/>
          <input placeholder="Buscar produto, NCM, fornecedor..." value={search} onChange={(e) => setSearch(e.target.value)}/>
        </div>
      </div>

      <div className="cat-split">
        <div className="table-wrap">
          <table className="t">
            <thead><tr>
              <th>Código Siscomex</th>
              <th>Denominação</th>
              <th>NCM</th>
              <th>Fabricante</th>
              <th>v.</th>
              <th>Status</th>
              <th>Atualizado</th>
              <th></th>
            </tr></thead>
            <tbody>
              {rows.map(p => {
                const fab = N.fabricantes.find(f => f.id === p.fabricante);
                const isSelected = p.id === selectedId;
                return (
                  <tr key={p.id} onClick={() => setSelectedId(p.id)}
                    style={isSelected ? { background: "#FFFBE6", boxShadow: "inset 3px 0 0 0 var(--vp-yellow)" } : null}>
                    <td>
                      {p.siscomex ? <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--fg1)" }}>{p.siscomex}</span>
                                  : <span className="muted small">— rascunho</span>}
                    </td>
                    <td>
                      <div className="cell-main" style={{ fontSize: 12.5, lineHeight: 1.3 }}>
                        {p.denominacao || <span className="muted">(sem denominação)</span>}
                      </div>
                      <div className="cell-sub">{p.id} · {p.projeto}</div>
                    </td>
                    <td>{p.ncm ? <span className="sku">{p.ncm}</span> : <span className="muted">—</span>}</td>
                    <td>{fab ? <span>{fab.flag} {fab.nome.split(" ")[0]} {fab.nome.split(" ")[1] || ""}</span> : <span className="muted">—</span>}</td>
                    <td><span className="cell-num">v{p.versao}</span></td>
                    <td><span className="ncm-status" data-s={p.status}>{p.status.replace(/_/g, " ").toLowerCase()}</span></td>
                    <td><span className="cell-sub">{p.updatedAt}</span></td>
                    <td>
                      <Button variant="ghost" size="sm" icon="more" data-tip="Mais ações"
                        onClick={(e) => { e.stopPropagation(); window.toast("Menu de ações em breve", "info"); }}/>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <div className="empty">
              <h4>Nenhum produto encontrado</h4>
              <p>Ajuste os filtros ou cadastre um novo produto pelo módulo de Engenharia.</p>
            </div>
          ) : null}
        </div>

        {selected ? (
          <div className="prod-detail">
            <div className="prod-detail__head">
              <div className="row sb">
                <span className="prod-detail__id">{selected.id}</span>
                <span className="ncm-status" data-s={selected.status}>{selected.status.replace(/_/g, " ").toLowerCase()}</span>
              </div>
              <div className="prod-detail__title">{selected.denominacao || "(Sem denominação)"}</div>
              {selected.siscomex ? <span className="mono small" style={{ color: "var(--fg2)" }}>Siscomex: <b style={{ color: "var(--fg1)" }}>{selected.siscomex}</b> · v{selected.versao}</span> : null}
            </div>
            <div className="prod-detail__tabs">
              {["dados", "atributos", "imagens", "historico"].map(t => (
                <button key={t} className={detailTab === t ? "is-active" : ""} onClick={() => setDetailTab(t)}>
                  {t === "dados" ? "Dados básicos" : t === "historico" ? "Histórico" : t}
                </button>
              ))}
            </div>
            <div className="prod-detail__body">
              {detailTab === "dados" && <CatDetailDados p={selected}/>}
              {detailTab === "atributos" && <CatDetailAtrs p={selected}/>}
              {detailTab === "imagens" && <CatDetailImagens p={selected}/>}
              {detailTab === "historico" && <CatDetailHistorico p={selected}/>}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CatDetailDados({ p }) {
  const N = window.__VP_NCM;
  const fab = N.fabricantes.find(f => f.id === p.fabricante);
  return (
    <div className="stack">
      <KvBlock label="Código NCM" value={p.ncm ? `${p.ncm} — ${p.ncmDesc}` : "—"} mono/>
      <KvBlock label="Projeto vinculado" value={p.projeto || "—"}/>
      <KvBlock label="Engenheiro" value={p.engenheiro || "—"}/>
      {p.aprovadoPor ? <KvBlock label="Aprovado por (Jurídico)" value={p.aprovadoPor}/> : null}
      {fab ? (
        <>
          <div className="hr"/>
          <div className="up-eyebrow muted">Fabricante</div>
          <div style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>{fab.flag} {fab.nome}</div>
          <div className="cell-sub mono">TIN: {fab.tin} · {fab.cidade}, {fab.subdivisao}</div>
        </>
      ) : null}
      <div className="hr"/>
      <div className="up-eyebrow muted" style={{ marginBottom: 6 }}>Detalhamento</div>
      <p className="small" style={{ color: "var(--fg2)", lineHeight: 1.6 }}>{p.detalhamento || <i>Sem detalhamento.</i>}</p>
    </div>
  );
}
function CatDetailAtrs({ p }) {
  const entries = Object.entries(p.atributos || {});
  if (entries.length === 0) return <div className="empty"><h4>Sem atributos</h4><p>Selecione um NCM para gerar os atributos.</p></div>;
  return (
    <div className="stack" style={{ gap: 0 }}>
      {entries.map(([k, v]) => (
        <div key={k} className="row sb" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
          <span className="up-eyebrow muted">{k}</span>
          <span className="mono" style={{ fontWeight: 600 }}>{typeof v === "boolean" ? (v ? "Sim" : "Não") : v}</span>
        </div>
      ))}
    </div>
  );
}
function CatDetailImagens({ p }) {
  return (
    <div>
      <NCMImageSlots filled={p.imagens} onAdd={() => window.toast("Upload em breve", "info")} onView={() => {}}/>
      <div style={{ height: 14 }}/>
      <NCMPdfZone fileName={p.fichaPdf}/>
    </div>
  );
}
function CatDetailHistorico({ p }) {
  const N = window.__VP_NCM;
  return (
    <div className="stack" style={{ gap: 0 }}>
      {N.historico.map((h, i) => (
        <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
          <div className="row sb">
            <span className="mono small" style={{ color: "var(--fg2)" }}>{h.data}</span>
            <span className="ncm-status" data-s={h.situacao === "Ativo" ? "CADASTRADO" : h.situacao === "Aprovado" ? "APROVADO" : h.situacao === "Aguard. Jurídico" ? "AGUARD_JURIDICO" : "EM_PREENCHIMENTO"}>{h.situacao}</span>
          </div>
          <div style={{ fontSize: 12.5, marginTop: 4 }}><b>{h.usuario}</b></div>
          <div className="cell-sub">{h.obs}</div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   Kanban de Solicitações NCM
   ============================================================ */
function NcmKanbanPage({ setRoute, setSubsel }) {
  const N = window.__VP_NCM;
  const [view, setView] = React.useState("kanban");
  const columns = [
    { key: "EM_PREENCHIMENTO", label: "Em preenchimento", hint: "Engenharia descrevendo o produto" },
    { key: "AGUARD_JURIDICO",  label: "Aguard. jurídico", hint: "Aguarda validação do código NCM" },
    { key: "APROVADO",          label: "Aprovado jurídico", hint: "Pronto para exportar" },
    { key: "APROVADO_PRONTO",   label: "Pronto LogComex", hint: "Em cadastro pelo time de importação" },
    { key: "CADASTRADO",        label: "Cadastrado Siscomex", hint: "Produto ATIVO disponível para Duimp" },
  ];

  // map APROVADO into both columns 3 and 4 demonstrativamente:
  const byCol = {};
  columns.forEach(c => byCol[c.key] = []);
  N.produtos.forEach(p => {
    if (p.status === "EM_PREENCHIMENTO" || p.status === "NAO_INICIADO") byCol.EM_PREENCHIMENTO.push(p);
    else if (p.status === "AGUARD_JURIDICO") byCol.AGUARD_JURIDICO.push(p);
    else if (p.status === "APROVADO") byCol.APROVADO_PRONTO.push(p);
    else if (p.status === "CADASTRADO") byCol.CADASTRADO.push(p);
  });
  // and a fake "aprovado jurídico = recently approved, awaiting hand-off"
  if (byCol.APROVADO_PRONTO.length > 1) {
    byCol.APROVADO.push(byCol.APROVADO_PRONTO.shift());
  }

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div className="page-head__l">
          <div className="page-head__eyebrow"><span className="vp-rule"/>Operações · Engenharia · Solicitações NCM</div>
          <h1 className="page-head__title">Solicitações de Classificação NCM</h1>
          <p className="page-head__sub">Produtos pendentes de descrição técnica, validação jurídica e cadastro Siscomex.</p>
        </div>
        <div className="page-head__r">
          <div className="seg">
            <button className={view === "lista" ? "is-active" : ""} onClick={() => setView("lista")}>
              <Icon.list size={12} style={{ marginRight: 6 }}/>Lista
            </button>
            <button className={view === "kanban" ? "is-active" : ""} onClick={() => setView("kanban")}>
              <Icon.grid size={12} style={{ marginRight: 6 }}/>Kanban
            </button>
          </div>
          <Button variant="primary" icon="plus" onClick={() => window.toast("Cadastro de produto em breve", "info")}>Novo produto</Button>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="kanban">
          {columns.map(c => (
            <div key={c.key} className="kanban__col">
              <div className={"kanban__col-head" + (byCol[c.key].length > 0 ? " is-active" : "")}>
                <span className="kanban__col-title">{c.label}</span>
                <span className="kanban__col-count">{byCol[c.key].length}</span>
              </div>
              <div className="kanban__col-body">
                {byCol[c.key].map(p => {
                  const fab = N.fabricantes.find(f => f.id === p.fabricante);
                  return (
                    <div key={p.id} className="kanban__card"
                      onClick={() => { setSubsel?.({ ncmProduct: p }); setRoute("ncm-detail"); }}>
                      <div className="kanban__card-eyebrow">{p.projeto} · {p.id}</div>
                      <div className="kanban__card-title">{p.denominacao || <i className="muted">(sem denominação)</i>}</div>
                      {p.ncm ? <div className="kanban__card-ncm"><span className="sku">{p.ncm}</span></div>
                              : <div className="kanban__card-ncm muted">NCM pendente</div>}
                      <div className="kanban__card-foot">
                        <span className="who">
                          {p.engenheiro ? (
                            <>
                              <div className="avatar sm">{p.engenheiro.split(" ").map(w => w[0]).join("").slice(0,2)}</div>
                              {p.engenheiro.split(" ")[0]}
                            </>
                          ) : <span className="muted" style={{ fontSize: 11 }}>—</span>}
                        </span>
                        <span>{fab ? fab.flag : ""}</span>
                        <span className="mono">{p.updatedAt}</span>
                      </div>
                    </div>
                  );
                })}
                {byCol[c.key].length === 0 ? (
                  <div style={{ padding: 18, textAlign: "center", color: "var(--fg3)", fontSize: 11, fontStyle: "italic" }}>vazio</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="t">
            <thead><tr>
              <th>Produto</th>
              <th>Projeto</th>
              <th>NCM</th>
              <th>Engenheiro</th>
              <th>Status</th>
              <th>Atualizado</th>
              <th></th>
            </tr></thead>
            <tbody>
              {N.produtos.filter(p => p.status !== "CADASTRADO").map(p => (
                <tr key={p.id} onClick={() => { setSubsel?.({ ncmProduct: p }); setRoute("ncm-detail"); }}>
                  <td>
                    <div className="cell-main" style={{ fontSize: 12.5, lineHeight: 1.3 }}>{p.denominacao || <i className="muted">(sem denominação)</i>}</div>
                    <div className="cell-sub">{p.id}</div>
                  </td>
                  <td><span className="mono small">{p.projeto}</span></td>
                  <td>{p.ncm ? <span className="sku">{p.ncm}</span> : <span className="muted">—</span>}</td>
                  <td>{p.engenheiro}</td>
                  <td><span className="ncm-status" data-s={p.status}>{p.status.replace(/_/g, " ").toLowerCase()}</span></td>
                  <td><span className="cell-sub">{p.updatedAt}</span></td>
                  <td><Button variant="ghost" size="sm" icon="chevRight"/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   NCM Detail page (acesso vindo do kanban)
   Renderiza a aba dentro de um page-wrapper
   ============================================================ */
function NcmDetailPage({ product, setRoute }) {
  const [showLogComex, setShowLogComex] = React.useState(false);
  if (!product) {
    return <EmptyStateRedirect icon="package" title="Nenhum produto selecionado"
      message="Escolha um produto na fila de solicitações NCM para ver os detalhes."
      ctaLabel="Ir para Solicitações NCM" onCta={() => setRoute("ncm-kanban")}/>;
  }
  return (
    <div className="page fade-in">
      <div className="row" style={{ marginBottom: 14 }}>
        <Button variant="ghost" size="sm" icon="chevLeft" onClick={() => setRoute("ncm-kanban")}>Voltar para Solicitações NCM</Button>
      </div>
      <div className="page-head">
        <div className="page-head__l">
          <div className="page-head__eyebrow"><span className="vp-rule"/>{product.id} · {product.projeto}</div>
          <h1 className="page-head__title">{product.denominacao ? (product.denominacao.length > 60 ? product.denominacao.slice(0, 60) + "…" : product.denominacao) : "Novo Produto"}</h1>
          <p className="page-head__sub">Ficha técnica para cadastro no Catálogo da Receita Federal (Siscomex/Duimp).</p>
        </div>
      </div>

      <NCMTab productId={product.id} onOpenLogComex={() => setShowLogComex(true)}/>

      {showLogComex ? <LogComexModal product={product} onClose={() => setShowLogComex(false)}/> : null}
    </div>
  );
}

/* ============================================================
   LogComex Export Modal
   ============================================================ */
function LogComexModal({ product, onClose }) {
  const N = window.__VP_NCM;
  const fab = N.fabricantes.find(f => f.id === product.fabricante);
  const checks = [
    "Confirmei que o código NCM está correto e validado pelo jurídico",
    "A Denominação está em português, sem abreviações",
    "O Detalhamento Complementar descreve suficientemente o produto",
    "Os atributos obrigatórios da NCM foram preenchidos",
    "O fabricante/produtor está identificado corretamente",
    "As imagens representam fielmente o produto a ser importado",
  ];
  const [checked, setChecked] = React.useState(new Set());
  const [copied, setCopied] = React.useState(false);
  const allChecked = checked.size === checks.length;

  const toggle = (i) => {
    const next = new Set(checked);
    if (next.has(i)) next.delete(i); else next.add(i);
    setChecked(next);
  };

  const copy = () => {
    const formatted = [
      `NCM: ${product.ncm}`,
      `Denominação: ${product.denominacao}`,
      `Detalhamento: ${product.detalhamento}`,
      `Fabricante: ${fab?.nome}`,
      `País: ${fab?.pais}`,
      `TIN: ${fab?.tin}`,
    ].join("\n");
    try { navigator.clipboard.writeText(formatted); } catch (e) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    window.toast("Dados copiados para a área de transferência", "success");
  };

  return (
    <Modal title="Exportar para LogComex" onClose={onClose} width={720}
      footer={<>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
        <Button variant="outline" size="sm" icon="download"
          onClick={() => window.toast(`Download iniciado — ${product.imagens} imagens .zip`, "success")}>
          Baixar imagens (.zip)
        </Button>
        <Button variant={allChecked ? "primary" : "outline"} size="sm"
          disabled={!allChecked}
          icon={copied ? "check" : "copy"}
          onClick={copy}>
          {copied ? "Copiado!" : "Copiar dados formatados"}
        </Button>
      </>}>

      <p className="vp-small" style={{ marginTop: 0, marginBottom: 14 }}>
        Catálogo de Produtos da plataforma LogComex. Confira o resumo abaixo, marque o checklist e clique em <b>Copiar dados formatados</b>.
      </p>

      <dl className="lc-resumo">
        <dt>NCM</dt>
        <dd>{product.ncm} — {product.ncmDesc}</dd>
        <dt>Denominação</dt>
        <dd>{product.denominacao}</dd>
        <dt>Fabricante</dt>
        <dd>{fab ? `${fab.flag} ${fab.nome} · ${fab.pais} · TIN: ${fab.tin}` : "—"}</dd>
        <dt>Anexos</dt>
        <dd>{product.imagens} imagens · {product.fichaPdf || "—"}</dd>
      </dl>

      <div className="up-eyebrow muted" style={{ marginBottom: 8 }}>Checklist de pré-envio (todos obrigatórios)</div>
      <div className="lc-checklist">
        {checks.map((c, i) => (
          <div key={i} className={"lc-check " + (checked.has(i) ? "checked" : "")} onClick={() => toggle(i)}>
            <div className="lc-check__box"/>
            <div className="lc-check__txt">{c}</div>
          </div>
        ))}
      </div>

      <div className="lc-steps" style={{ marginTop: 16 }}>
        <div className="up-eyebrow" style={{ color: "var(--vp-yellow)", marginBottom: 6 }}>Instruções</div>
        <b>O VP Gestão não envia diretamente ao Siscomex.</b>
        <ol>
          <li>Clique em <strong>Copiar dados formatados</strong></li>
          <li>Acesse <strong>plataforma.logcomex</strong> → Catálogo de Produtos → Novo Produto</li>
          <li>Cole os dados nos campos correspondentes</li>
          <li>Anexe as imagens do <strong>.zip</strong> baixado</li>
          <li>Ative o produto e copie o Código Siscomex gerado (<strong>PRD-xxxxx</strong>)</li>
          <li>Volte aqui e clique em <strong>"Marcar como cadastrado"</strong></li>
        </ol>
      </div>
    </Modal>
  );
}

/* ============================================================
   NCM Widget — Dashboard
   ============================================================ */
function NcmDashboardWidget({ setRoute, ncm = [] }) {
  const stuck = ncm.filter(p => p.status === "EM_PREENCHIMENTO").length;
  const inJur = ncm.filter(p => p.status === "AGUARD_JURIDICO").length;
  const ready = ncm.filter(p => p.status === "APROVADO").length;

  return (
    <div className="ncm-widget">
      <div className="ncm-widget__title"><Icon.package size={12}/> Pendências NCM</div>
      {ncm.length === 0 ? (
        <div className="muted" style={{ padding: '12px 0', fontSize: 12, textAlign: 'center' }}>Nenhuma solicitação NCM pendente.</div>
      ) : (
        <>
          {stuck > 0 && <div className="ncm-widget__row">
            <Icon.warning size={14} color="var(--vp-warning)"/>
            <span><b>{stuck}</b> fichas técnicas em preenchimento há +5 dias</span>
          </div>}
          {inJur > 0 && <div className="ncm-widget__row">
            <Icon.warning size={14} color="var(--vp-warning)"/>
            <span><b>{inJur}</b> produtos aguardando validação jurídica</span>
          </div>}
          {ready > 0 && <div className="ncm-widget__row">
            <Icon.check size={14} color="var(--vp-success)"/>
            <span><b>{ready}</b> produto{ready !== 1 ? "s" : ""} aprovado{ready !== 1 ? "s" : ""} aguardando cadastro LogComex</span>
          </div>}
        </>
      )}
      <div className="ncm-widget__cta">
        <Button variant="ghost" size="sm" iconRight="arrowRight" onClick={() => setRoute("ncm-kanban")}>Ver todas</Button>
      </div>
    </div>
  );
}

Object.assign(window, { NcmCatalogoPage, NcmKanbanPage, NcmDetailPage, LogComexModal, NcmDashboardWidget });
