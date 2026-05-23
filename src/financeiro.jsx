/* ============================================================
   financeiro.jsx — Gatilhos & Prazo Reverso, Comissões,
                    Notificações, Configurações
   ============================================================ */

function FinanceiroPage() {
  const [gatilhos, setGatilhos] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    window.__VP_SB.sb.from('gatilhos').select('*').order('due_date')
      .then(({ data }) => { setGatilhos(data || []); setLoading(false); });
  }, []);

  if (loading) return <div style={{ textAlign:'center', padding:'60px 0', color:'var(--fg3)', fontSize:13 }}>Carregando…</div>;

  const urgentes = gatilhos.filter(g => (g.days_left ?? g.daysLeft ?? 99) <= 2);

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div className="page-head__l">
          <div className="page-head__eyebrow"><span className="vp-rule"/>Financeiro · Prazo Reverso</div>
          <h1 className="page-head__title">Gatilhos & Prazo Reverso</h1>
          <p className="page-head__sub">Pagamentos disparados por marcos contratuais. Cálculo de prazo reverso a partir da data de instalação.</p>
        </div>
        <div className="page-head__r">
          <Button variant="outline" icon="download" onClick={() => window.toast("Exportação CSV/Excel em breve", "info")}>Exportar fluxo</Button>
          <Button variant="primary" icon="plus" onClick={() => window.toast("Criação de gatilhos manuais em breve", "info")}>Novo gatilho</Button>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <KPI label="A receber 30d" value="—" sub="contratos" delta="—" deltaDir="up" icon="dollar"/>
        <KPI label="Gatilhos próx. 7d" value={gatilhos.filter(g => (g.days_left ?? g.daysLeft ?? 99) <= 7 && (g.days_left ?? g.daysLeft ?? 99) > 0).length} sub="atenção" delta="—" deltaDir="up" icon="zap"/>
        <KPI label="Em atraso" value={gatilhos.filter(g => (g.days_left ?? g.daysLeft ?? 0) < 0).length} sub="ação urgente" delta="—" deltaDir="down" icon="warning"/>
        <KPI label="Recebido (mês)" value="—" sub="—" delta="—" deltaDir="up" icon="trending"/>
      </div>

      {urgentes.length > 0 && (
        <div className="alert danger" style={{ marginBottom: 20 }}>
          <Icon.warning/>
          <div style={{ flex: 1 }}>
            <div className="alert__title">{urgentes.length} gatilho{urgentes.length > 1 ? 's' : ''} vence{urgentes.length === 1 ? '' : 'm'} em até 2 dias</div>
            <div className="alert__sub">Verifique os gatilhos abaixo e confirme os pagamentos pendentes.</div>
          </div>
          <Button variant="secondary" size="sm" iconRight="arrowRight">Ver agora</Button>
        </div>
      )}

      <Card title="Gatilhos Ativos" sub={`${gatilhos.length} projetos · prazo reverso calculado a partir da instalação`}>
        <div className="stack" style={{ gap: 14 }}>
          {gatilhos.length === 0 && (
            <div style={{ textAlign:'center', padding:'48px 0', color:'var(--fg3)', fontSize:13 }}>
              Nenhum registro cadastrado.
            </div>
          )}
          {gatilhos.map((g) => (
            <GatilhoCard key={g.id} g={g}/>
          ))}
        </div>
      </Card>
    </div>
  );
}

function GatilhoCard({ g }) {
  const dueColor = g.daysLeft <= 2 ? "var(--vp-danger)" : g.daysLeft <= 7 ? "var(--vp-warning)" : "var(--vp-success)";
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", padding: 0, position: "relative" }}>
      <span style={{ position: "absolute", top: 0, left: 0, width: 24, height: 3, background: "var(--vp-yellow)" }}/>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 200px", gap: 14, padding: "16px 20px", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
        <div>
          <div className="up-eyebrow muted">{g.projeto} · {g.trigger}</div>
          <div style={{ fontSize: 16, fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", marginTop: 4 }}>{g.building}</div>
        </div>
        <div>
          <div className="up-eyebrow muted">Valor</div>
          <div className="cell-money mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{fmtBRL(g.value)}</div>
        </div>
        <div>
          <div className="up-eyebrow muted">Vencimento</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4, color: dueColor }}>{fmtDateLong(g.dueDate)}</div>
          <div className="mono small" style={{ color: dueColor }}>{g.daysLeft > 0 ? `em ${g.daysLeft} dias` : `vencido há ${-g.daysLeft}d`}</div>
        </div>
        <div className="row gap-2" style={{ justifyContent: "flex-end" }}>
          {g.status === "ok" ? <Badge variant="success" dot>OK</Badge>
           : g.status === "atencao" ? <Badge variant="warning" dot>Atenção</Badge>
           : <Badge variant="danger" dot>Pendente</Badge>}
          <Button variant={g.daysLeft <= 2 ? "primary" : "outline"} size="sm" icon="check"
            onClick={() => window.toast(`Gatilho "${g.trigger}" confirmado`, "success")}>Confirmar</Button>
        </div>
      </div>

      <div style={{ padding: "14px 20px", background: "var(--vp-gray-50)" }}>
        <div className="up-eyebrow muted" style={{ marginBottom: 10 }}>
          <Icon.history size={11} style={{ verticalAlign: "middle", marginRight: 4 }}/>
          Prazo reverso · base: {g.reverseFrom}
        </div>
        <div className="prazo-chain">
          {g.chain.map((c, i) => {
            const lastIdx = g.chain.length - 1;
            const cls = i === lastIdx ? "current" : i < lastIdx - 1 ? "success" : "warning";
            return (
              <div key={i} className={"prazo-step " + cls}>
                <div className="prazo-step__lbl">Etapa {i + 1}</div>
                <div className="prazo-step__t">{c.split(" — ")[0] || c}</div>
                {c.includes(" — ") ? <div className="prazo-step__d">{c.split(" — ")[1]}</div> : null}
                {i < g.chain.length - 1 ? (
                  <div className="prazo-step__arrow"><Icon.arrowRight size={10}/></div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- COMISSÕES ---------- */
function ComissoesPage() {
  const [comissoes, setComissoes] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    window.__VP_SB.sb.from('comissoes').select('*').order('id')
      .then(({ data }) => { setComissoes(data || []); setLoading(false); });
  }, []);

  if (loading) return <div style={{ textAlign:'center', padding:'60px 0', color:'var(--fg3)', fontSize:13 }}>Carregando…</div>;

  const total = comissoes.reduce((a, c) => a + (c.comissao || 0), 0);
  const totalAprovado = comissoes.filter(c => c.status === "Aprovado").reduce((a, c) => a + (c.comissao || 0), 0);
  const totalAguardando = comissoes.filter(c => c.status !== "Aprovado" && c.status !== "Pago").reduce((a, c) => a + (c.comissao || 0), 0);

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div className="page-head__l">
          <div className="page-head__eyebrow"><span className="vp-rule"/>Financeiro · Comissões</div>
          <h1 className="page-head__title">Comissões — Q2/26</h1>
          <p className="page-head__sub">Comissionamento sobre faturamento líquido · liberação após confirmação de entrada</p>
        </div>
        <div className="page-head__r">
          <Button variant="outline" icon="download" onClick={() => window.toast("Exportação em breve", "info")}>Folha de pagto</Button>
          <Button variant="primary" icon="check" onClick={() => window.toast("Todas as comissões aprovadas — Q2/26", "success")}>Aprovar todas</Button>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <KPI label="Total comissões Q2" value={fmtBRL(total)} sub={`${comissoes.length} colaboradores`} delta="—" deltaDir="up" icon="award"/>
        <KPI label="Aprovado" value={fmtBRL(totalAprovado)} sub="liberado" delta="—" deltaDir="up" icon="check"/>
        <KPI label="Aguardando" value={fmtBRL(totalAguardando)} sub="trigger pendente" delta="—" deltaDir="up" icon="clock"/>
        <KPI label="Maior comissão" value={comissoes.length > 0 ? fmtBRL(Math.max(...comissoes.map(c => c.comissao || 0))) : "—"} sub="—" delta="—" deltaDir="flat" icon="award"/>
      </div>

      <Card title="Resumo por vendedor" sub={`${comissoes.length} colaboradores · pagamento dia 10`}>
        <div className="table-wrap" style={{ border: 0 }}>
          <table className="t">
            <thead><tr>
              <th>Vendedor</th>
              <th>Projetos fechados</th>
              <th className="text-right">Faturamento líquido</th>
              <th>%</th>
              <th className="text-right">Comissão Q2</th>
              <th>Progresso</th>
              <th>Status</th>
              <th></th>
            </tr></thead>
            <tbody>
              {comissoes.length === 0 && (
                <tr><td colSpan={99} style={{ textAlign:'center', padding:'48px 0', color:'var(--fg3)', fontSize:13 }}>
                  Nenhum registro cadastrado.
                </td></tr>
              )}
              {comissoes.map((c, i) => (
                <tr key={c.id || c.vendedor}>
                  <td>
                    <div className="row gap-3">
                      <div className="avatar">{(c.vendedor || "?").split(" ").map(w => w[0]).join("").slice(0,2)}</div>
                      <div>
                        <div className="cell-main">{c.vendedor}</div>
                        <div className="cell-sub">{c.role}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="cell-num">{c.projetos}</span></td>
                  <td className="cell-money">{fmtBRL(c.faturado)}</td>
                  <td><span className="cell-num">{c.pct}%</span></td>
                  <td className="cell-money" style={{ fontSize: 14, fontWeight: 800 }}>{fmtBRL(c.comissao)}</td>
                  <td style={{ width: 140 }}>
                    <div className="progress" style={{ marginBottom: 4 }}>
                      <span style={{ width: ((c.comissao / 150000) * 100) + "%", background: i % 2 ? "var(--vp-yellow-press)" : "var(--vp-yellow)" }}/>
                    </div>
                    <div className="cell-sub mono">{Math.round(c.comissao / 150000 * 100)}% meta Q</div>
                  </td>
                  <td><StatusBadge status={c.status}/></td>
                  <td>
                    {c.status === "Aprovado" ? <Button variant="primary" size="sm" icon="dollar" onClick={() => window.toast(`Pagamento de ${fmtBRL(c.comissao)} para ${c.vendedor} liberado`, "success")}>Pagar</Button>
                     : c.status === "Pago" ? <Button variant="ghost" size="sm" icon="check"/>
                     : <Button variant="outline" size="sm" icon="check" onClick={() => window.toast(`Comissão de ${c.vendedor} aprovada`, "success")}>Aprovar</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ marginTop: 14, padding: "12px 16px", background: "#000", color: "var(--vp-yellow)" }} className="row sb">
        <span style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontWeight: 800, fontSize: 14 }}>Total a pagar Q2/26</span>
        <span className="mono" style={{ fontSize: 22, fontWeight: 800 }}>{fmtBRL(total)}</span>
      </div>
    </div>
  );
}

/* ---------- NOTIFICAÇÕES ---------- */
function NotificacoesPage({ setRoute }) {
  // TODO: conectar Supabase — tabela de notificações não mapeada ainda
  const [filter, setFilter] = React.useState("Todas");
  const filters = ["Todas", "Não lidas", "Menções", "Aprovações"];
  const notifications = [];
  const groups = {};

  const ICON_MAP = { "user-plus": "users", "check": "check", "ship": "ship", "mail": "mail", "at-sign": "at", "dollar": "dollar", "calendar": "calendar" };

  return (
    <div className="page fade-in">
      <div className="page-head">
        <div className="page-head__l">
          <div className="page-head__eyebrow"><span className="vp-rule"/>Central</div>
          <h1 className="page-head__title">Notificações</h1>
          <p className="page-head__sub">Agrupadas por módulo · respostas rápidas inline</p>
        </div>
        <div className="page-head__r">
          <Button variant="outline" icon="settings" onClick={() => window.toast("Tela de preferências em breve", "info")}>Preferências</Button>
          <Button variant="primary" icon="check" onClick={() => window.toast("Notificações marcadas como lidas", "success")}>Marcar todas como lidas</Button>
        </div>
      </div>

      <div className="tbar">
        <div className="seg">
          {filters.map(f => <button key={f} className={filter === f ? "is-active" : ""} onClick={() => setFilter(f)}>{f}</button>)}
        </div>
        <div className="spacer"/>
        <Button variant="outline" size="sm" icon="filter">Por módulo</Button>
      </div>

      <div className="table-wrap" style={{ padding: 0 }}>
        {Object.entries(groups).length === 0 && (
          <div style={{ textAlign:'center', padding:'48px 0', color:'var(--fg3)', fontSize:13 }}>
            Nenhuma notificação encontrada.
          </div>
        )}
        {Object.entries(groups).map(([grp, items]) => (
          <div key={grp}>
            <div style={{ padding: "10px 20px", background: "var(--vp-gray-100)", fontSize: 10, fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--fg2)", borderBottom: "1px solid var(--border)" }}>{grp}</div>
            {items.map((n) => {
              const I = Icon[ICON_MAP[n.icon] || "bell"] || Icon.bell;
              return (
                <div key={n.id} className={"notif-row " + (n.unread ? "unread" : "")}>
                  <div className="notif-row__icon"><I size={16}/></div>
                  <div className="notif-row__body">
                    <div className="notif-row__title">{n.title}</div>
                    <div className="notif-row__meta">
                      <span>{n.module}</span>
                      <span>·</span>
                      <span>{n.time}</span>
                    </div>
                  </div>
                  <div className="row gap-2">
                    <Button variant="ghost" size="sm" icon="check"/>
                    <Button variant="ghost" size="sm" icon="more"/>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- CONFIGURAÇÕES ---------- */
function ConfiguracoesPage() {
  const [tab, setTab] = React.useState("usuarios");
  return (
    <div className="page fade-in">
      <div className="page-head">
        <div className="page-head__l">
          <div className="page-head__eyebrow"><span className="vp-rule"/>Admin · Configurações</div>
          <h1 className="page-head__title">Configurações do Sistema</h1>
          <p className="page-head__sub">Usuários, permissões, parâmetros financeiros, integrações de API.</p>
        </div>
      </div>

      <Tabs tabs={[
        { key: "usuarios", label: "Usuários & Perfis", icon: "users" },
        { key: "permissoes", label: "Permissões (RLS)", icon: "shield" },
        { key: "parametros", label: "Parâmetros", icon: "settings" },
        { key: "integracoes", label: "Integrações", icon: "globe" },
        { key: "buckets", label: "Buckets Storage", icon: "package" },
      ]} active={tab} onChange={setTab}/>

      <div style={{ marginTop: 24 }}>
        {tab === "usuarios" && <ConfigUsers/>}
        {tab === "permissoes" && <ConfigPermissions/>}
        {tab === "parametros" && <ConfigParams/>}
        {tab === "integracoes" && <ConfigIntegrations/>}
        {tab === "buckets" && <ConfigBuckets/>}
      </div>
    </div>
  );
}

function ConfigUsers() {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    window.__VP_SB.sb.from('usuarios').select('*').order('name')
      .then(({ data }) => { setUsers(data || []); setLoading(false); });
  }, []);

  if (loading) return <div style={{ textAlign:'center', padding:'32px 0', color:'var(--fg3)', fontSize:13 }}>Carregando…</div>;

  return (
    <Card title="Usuários" sub={`${users.length} cadastrados`}
      action={<Button variant="primary" size="sm" icon="plus" onClick={() => window.toast("Convite de usuário — próxima fase", "info")}>Convidar usuário</Button>}>
      <div className="table-wrap" style={{ border: 0 }}>
        <table className="t">
          <thead><tr>
            <th>Nome</th><th>Perfil</th><th>Email</th><th>Último login</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={99} style={{ textAlign:'center', padding:'48px 0', color:'var(--fg3)', fontSize:13 }}>
                Nenhum usuário cadastrado.
              </td></tr>
            )}
            {users.map(u => (
              <tr key={u.id || u.email}>
                <td>
                  <div className="row gap-3">
                    <div className="avatar">{(u.name || u.email || "?").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}</div>
                    <span className="cell-main">{u.name || u.email}</span>
                  </div>
                </td>
                <td><Badge variant="ink">{u.role || "—"}</Badge></td>
                <td><span className="mono small">{u.email}</span></td>
                <td><span className="mono small muted">{u.last_login ? fmtDate(u.last_login) : "—"}</span></td>
                <td><Badge variant={u.active !== false ? "success" : "neutral"} dot>{u.active !== false ? "Ativo" : "Inativo"}</Badge></td>
                <td><Button variant="ghost" size="sm" icon="more"/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ConfigPermissions() {
  const modules = ["Leads", "Cotações", "Precificação", "Propostas", "Jurídico", "Engenharia", "Financeiro", "Importação", "Compras", "Instalação", "Comissões"];
  const perms = [
    { role: "Admin", access: modules.map(() => "rwx") },
    { role: "Comercial Sr.", access: ["rwx", "rwx", "rwx", "rwx", "r", "r", "r", "r", "r", "r", "r"] },
    { role: "Comercial Pleno", access: ["rwx", "rwx", "r", "rwx", "r", "r", "-", "r", "r", "r", "-"] },
    { role: "Engenharia", access: ["r", "r", "r", "r", "r", "rwx", "-", "rwx", "rwx", "rwx", "-"] },
    { role: "Jurídico", access: ["r", "r", "-", "r", "rwx", "r", "r", "r", "r", "r", "-"] },
    { role: "Financeiro", access: ["r", "r", "rwx", "r", "r", "r", "rwx", "rwx", "rwx", "r", "rwx"] },
    { role: "Instalação", access: ["-", "-", "-", "-", "-", "r", "-", "r", "r", "rwx", "-"] },
  ];
  return (
    <Card title="Matriz de Permissões (RLS Supabase)" sub="r=leitura · w=criar/editar · x=ações restritas">
      <div style={{ overflowX: "auto" }}>
        <table className="t" style={{ minWidth: 880 }}>
          <thead><tr>
            <th style={{ position: "sticky", left: 0, background: "var(--vp-gray-50)", zIndex: 2 }}>Perfil</th>
            {modules.map(m => <th key={m} style={{ textAlign: "center" }}>{m}</th>)}
          </tr></thead>
          <tbody>
            {perms.map(p => (
              <tr key={p.role}>
                <td style={{ position: "sticky", left: 0, background: "#fff", zIndex: 1, fontWeight: 700 }}>{p.role}</td>
                {p.access.map((a, i) => (
                  <td key={i} style={{ textAlign: "center" }}>
                    <PermCell value={a}/>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function PermCell({ value }) {
  if (value === "-") return <span style={{ color: "var(--vp-gray-300)" }}>—</span>;
  const color = value === "rwx" ? "var(--vp-success)" : value === "rw" ? "var(--vp-info)" : value === "r" ? "var(--vp-gray-400)" : "var(--vp-warning)";
  const bg = value === "rwx" ? "var(--vp-success-tint)" : value === "r" ? "var(--vp-gray-100)" : "var(--vp-warning-tint)";
  return <span style={{ display: "inline-block", padding: "2px 8px", background: bg, color, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 10, letterSpacing: ".1em" }}>{value.toUpperCase()}</span>;
}

function ConfigParams() {
  return (
    <div className="grid-2" style={{ gap: 16 }}>
      <Card title="Parâmetros Financeiros" sharp>
        <div className="stack">
          <ParamRow label="Câmbio USD → BRL (manual)" value="R$ 5,18" mono/>
          <ParamRow label="Margem mínima projeto" value="22%" mono/>
          <ParamRow label="Margem padrão" value="32%" mono/>
          <ParamRow label="Comissão padrão vendedor" value="4%" mono/>
          <ParamRow label="ICMS padrão (SP)" value="18%" mono/>
          <ParamRow label="II padrão equipamentos" value="14%" mono/>
        </div>
      </Card>
      <Card title="Parâmetros Operacionais" sharp>
        <div className="stack">
          <ParamRow label="SLA visita técnica" value="5 dias úteis"/>
          <ParamRow label="SLA laudo engenharia" value="4 dias úteis"/>
          <ParamRow label="Tempo médio importação" value="55 dias"/>
          <ParamRow label="Validade padrão proposta" value="30 dias"/>
          <ParamRow label="Garantia padrão" value="24 meses fab + 12 meses serv."/>
          <ParamRow label="Reten. inst. (calendário)" value="1 obra/equipe simultânea"/>
        </div>
      </Card>
    </div>
  );
}

function ParamRow({ label, value, mono }) {
  return (
    <div className="row sb" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 13, color: "var(--fg2)" }}>{label}</span>
      <span style={{ fontFamily: mono ? "var(--font-mono)" : "inherit", fontWeight: 700, fontSize: 13 }}>{value}</span>
    </div>
  );
}

function ConfigIntegrations() {
  const integrations = [
    { name: "MarineTraffic API", status: "Ativo", last: "—", desc: "Rastreamento de navios em tempo real" },
    { name: "VesselFinder (fallback)", status: "Standby", last: "—", desc: "API secundária de rastreamento" },
    { name: "IMAP — cotacoes@verticalparts.com.br", status: "Ativo", last: "—", desc: "Inbox Importação" },
    { name: "IMAP — compras@verticalparts.com.br", status: "Ativo", last: "—", desc: "Inbox Compras Nacional" },
    { name: "SMTP — envio transacional", status: "Ativo", last: "—", desc: "Notificações e propostas" },
    { name: "DocuSign", status: "Ativo", last: "—", desc: "Assinatura digital de contratos" },
    { name: "ContaAzul (faturamento)", status: "Ativo", last: "—", desc: "Sincronização NF / contas a receber" },
    { name: "WhatsApp Business API", status: "Inativo", last: "—", desc: "Notificações para vendedores" },
  ];
  return (
    <Card title="Integrações Externas" sub={integrations.length + " serviços conectados"}>
      <div className="grid-2" style={{ gap: 12 }}>
        {integrations.map((i) => (
          <div key={i.name} style={{ padding: 14, background: "#fff", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, background: i.status === "Ativo" ? "var(--vp-success-tint)" : i.status === "Standby" ? "var(--vp-warning-tint)" : "var(--vp-gray-100)", display: "flex", alignItems: "center", justifyContent: "center", color: i.status === "Ativo" ? "var(--vp-success)" : i.status === "Standby" ? "var(--vp-warning-ink)" : "var(--fg3)" }}>
              {React.createElement(Icon.globe, { size: 18 })}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row sb">
                <span style={{ fontWeight: 700, fontSize: 13 }}>{i.name}</span>
                <Badge variant={i.status === "Ativo" ? "success" : i.status === "Standby" ? "warning" : "neutral"} dot>{i.status}</Badge>
              </div>
              <div className="cell-sub" style={{ marginTop: 2 }}>{i.desc}</div>
              <div className="row sb mono small" style={{ marginTop: 4, color: "var(--fg3)" }}>
                <span>Última sync: {i.last}</span>
                <Button variant="ghost" size="sm" icon="settings"/>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ConfigBuckets() {
  const buckets = [
    { name: "contratos-originais", policy: "Privado · só Jurídico" },
    { name: "contratos-redigidos", policy: "Privado · vendedor+cliente" },
    { name: "propostas-pdf", policy: "Privado · vendedor" },
    { name: "engenharia-fotos", policy: "Privado · engenharia+admin" },
    { name: "embarques-docs", policy: "Privado · log+adm" },
    { name: "obras-laudos", policy: "Privado · cliente final" },
  ];
  return (
    <Card title="Supabase Storage Buckets" sub={`${buckets.length} buckets configurados`}>
      <div className="table-wrap" style={{ border: 0 }}>
        <table className="t">
          <thead><tr><th>Bucket</th><th>Arquivos</th><th>Tamanho</th><th>Política</th><th></th></tr></thead>
          <tbody>
            {buckets.map((b) => (
              <tr key={b.name}>
                <td><span className="mono" style={{ fontWeight: 700 }}>{b.name}</span></td>
                <td className="cell-num muted">—</td>
                <td className="cell-num muted">—</td>
                <td><Badge variant="outline">{b.policy}</Badge></td>
                <td><Button variant="ghost" size="sm" icon="more"/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

Object.assign(window, { FinanceiroPage, ComissoesPage, NotificacoesPage, ConfiguracoesPage });
