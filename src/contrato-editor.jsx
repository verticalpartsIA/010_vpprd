/* ============================================================
   contrato-editor.jsx — Editor do Contrato (Cliente | Montador)
   Layout IDÊNTICO ao PropostaEditor:
     topbar · tipo-tabs · pe__main (sidenav + form) · preview
   ============================================================ */

/* ---------- helpers ---------- */
function dataBR(iso) {
  if (!iso) return "__ de __________ de ____";
  const [a, m, d] = iso.split('-');
  const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  return `${parseInt(d)} de ${meses[parseInt(m)-1]} de ${a}`;
}
const UF_LIST = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function makeDefaultDados(contrato) {
  const d = contrato?.dados || {};
  const hoje = new Date().toISOString().slice(0,10);
  return {
    numero:      d.numero      || contrato?.id || '',
    dataEmissao: d.dataEmissao || contrato?.issued_date || hoje,
    propostaRef: d.propostaRef || contrato?.project_id || '',
    advogado:    d.advogado    || contrato?.lawyer || '',
    razaoSocial: d.razaoSocial || contrato?.client || '',
    cnpj:        d.cnpj        || '',
    logradouro:  d.logradouro  || '',
    numero_end:  d.numero_end  || '',
    bairro:      d.bairro      || '',
    cidade:      d.cidade      || '',
    estado:      d.estado      || 'SP',
    cep:         d.cep         || '',
    responsavel: d.responsavel || '',
    rg:          d.rg          || '',
    cpf:         d.cpf         || '',
    nacionalidade: d.nacionalidade || 'brasileiro(a)',
    estadoCivil: d.estadoCivil || '',
    profissao:   d.profissao   || 'empresário(a)',
    endRespRua:    d.endRespRua    || '',
    endRespNumero: d.endRespNumero || '',
    endRespBairro: d.endRespBairro || '',
    endRespCidade: d.endRespCidade || '',
    endRespEstado: d.endRespEstado || 'SP',
    qtdEquip:    d.qtdEquip    || '1',
    modeloEquip: d.modeloEquip || '',
    entregaRua:  d.entregaRua  || '',
    entregaNum:  d.entregaNum  || '',
    entregaBairro: d.entregaBairro || '',
    entregaCidade: d.entregaCidade || '',
    entregaEstado: d.entregaEstado || 'SP',
    entregaCep:  d.entregaCep  || '',
    valorTotal:  d.valorTotal  || '',
    valorExtenso: d.valorExtenso || '',
    parcelas: d.parcelas || [
      { desc: 'Sinal — assinatura do contrato', pct: '40', valor: '' },
      { desc: '1ª Parcela',                     pct: '',   valor: '' },
      { desc: '2ª Parcela',                     pct: '',   valor: '' },
      { desc: '3ª Parcela',                     pct: '',   valor: '' },
    ],
    cidadeAss:   d.cidadeAss   || 'São Paulo',
    dataAss:     d.dataAss     || hoje,
    test1Nome:   d.test1Nome   || '',
    test1Cpf:    d.test1Cpf    || '',
    test2Nome:   d.test2Nome   || '',
    test2Cpf:    d.test2Cpf    || '',
  };
}

/* ---------- Seções de navegação ---------- */
const SECOES_CLIENTE = [
  { id: 'dados',     title: 'Dados do Contrato',       icon: 'file',      group: 'IDENTIFICAÇÃO' },
  { id: 'comprador', title: 'Comprador',                icon: 'user',      group: 'IDENTIFICAÇÃO' },
  { id: 'objeto',    title: 'Objeto do Contrato',       icon: 'package',   group: 'ESCOPO' },
  { id: 'preco',     title: 'Preço e Pagamento',        icon: 'dollar',    group: 'COMERCIAL' },
  { id: 'assinatura',title: 'Assinatura das Partes',    icon: 'signature', group: 'FORMALIZAÇÃO' },
];

function fillPct(dados) {
  const checks = [
    dados.numero, dados.dataEmissao,
    dados.razaoSocial, dados.cnpj, dados.logradouro, dados.responsavel, dados.cpf,
    dados.modeloEquip, dados.entregaRua,
    dados.valorTotal, dados.valorExtenso,
    dados.cidadeAss, dados.dataAss,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

function sectionFill(id, dados) {
  const checks = {
    dados:     [dados.numero, dados.dataEmissao, dados.propostaRef],
    comprador: [dados.razaoSocial, dados.cnpj, dados.logradouro, dados.responsavel, dados.cpf],
    objeto:    [dados.modeloEquip, dados.entregaRua, dados.qtdEquip],
    preco:     [dados.valorTotal, dados.valorExtenso],
    assinatura:[dados.cidadeAss, dados.dataAss],
  };
  const arr = checks[id] || [];
  const done = arr.filter(Boolean).length;
  if (done === arr.length && arr.length > 0) return 'full';
  if (done > 0) return 'partial';
  return 'empty';
}

/* ============================================================
   ContratoEditorPage — full-page editor (idêntico ao PropostaEditor)
   ============================================================ */
function ContratoEditorPage({ contrato, setRoute, onSaved }) {
  const [dados, setDados] = React.useState(() => makeDefaultDados(contrato));
  const [tipoContrato] = React.useState(contrato?.tipo_contrato || 'cliente');
  const [activeSection, setActiveSection] = React.useState('dados');
  const [collapsed, setCollapsed] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState(Date.now());
  const [tick, setTick] = React.useState(0);
  const formRef = React.useRef(null);

  // Tick para "salvado há Xs"
  React.useEffect(() => {
    const t = setInterval(() => setTick(p => p+1), 5000);
    return () => clearInterval(t);
  }, []);

  // Active section follows scroll
  React.useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const handler = () => {
      const top = form.scrollTop;
      let best = SECOES_CLIENTE[0].id;
      for (const s of SECOES_CLIENTE) {
        const el = document.getElementById('csec-' + s.id);
        if (el && el.offsetTop - 100 <= top) best = s.id;
      }
      setActiveSection(best);
    };
    form.addEventListener('scroll', handler, { passive: true });
    return () => form.removeEventListener('scroll', handler);
  }, []);

  const set = (k, v) => setDados(p => ({ ...p, [k]: v }));
  const setParcela = (i, k, v) => setDados(p => {
    const pars = [...p.parcelas]; pars[i] = { ...pars[i], [k]: v };
    return { ...p, parcelas: pars };
  });
  const addParcela = () => setDados(p => ({
    ...p, parcelas: [...p.parcelas, { desc: `${p.parcelas.length}ª Parcela`, pct: '', valor: '' }]
  }));
  const removeParcela = (i) => setDados(p => ({ ...p, parcelas: p.parcelas.filter((_,idx) => idx !== i) }));

  const jump = (id) => {
    const el = document.getElementById('csec-' + id);
    if (el && formRef.current) formRef.current.scrollTo({ top: el.offsetTop - 20, behavior: 'smooth' });
    setActiveSection(id);
  };

  const save = async (novoStatus) => {
    setSaving(true);
    const upd = {
      dados, client: dados.razaoSocial || contrato?.client,
      project_id: dados.propostaRef || contrato?.project_id,
      lawyer: dados.advogado || contrato?.lawyer,
      value: dados.valorTotal ? parseFloat(dados.valorTotal.replace(/\./g,'').replace(',','.')) : contrato?.value,
      ...(novoStatus ? { status: novoStatus } : {}),
    };
    const { error } = await window.__VP_SB.sb.from('contratos').update(upd).eq('id', contrato.id);
    setSaving(false);
    if (error) return window.toast('Erro ao salvar: ' + error.message, 'error');
    setSavedAt(Date.now());
    if (novoStatus) window.toast(novoStatus === 'Em assinatura digital' ? 'Enviado para assinatura!' : 'Marcado como assinado — Compra desbloqueada!', 'success');
    onSaved?.();
  };

  const pct   = fillPct(dados);
  const fDone = SECOES_CLIENTE.filter(s => sectionFill(s.id, dados) === 'full').length;
  const preenchido = dados.razaoSocial && dados.cnpj && dados.modeloEquip && dados.valorTotal;

  // Groups for sidenav
  const groups = {};
  SECOES_CLIENTE.forEach(s => { if (!groups[s.group]) groups[s.group] = []; groups[s.group].push(s); });

  return (
    <div className="page fade-in" style={{ padding: 0, maxWidth: 'none' }}>

      {/* ===== TOP BAR ===== */}
      <div style={{ padding: '20px 32px 16px', background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div className="row" style={{ marginBottom: 8 }}>
          <Button variant="ghost" size="sm" icon="chevLeft" onClick={() => setRoute('juridico')}>Voltar para Contratos</Button>
          <div className="spacer" style={{ flex: 1 }}/>
          <div className="row gap-3" style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg3)' }}>
            <span>Última edição: {Math.max(0, Math.floor((Date.now()-savedAt)/1000))}s atrás</span>
            <span style={{ color: 'var(--vp-success)' }}>● Salvamento ativo</span>
          </div>
        </div>
        <div className="row sb">
          <div>
            <div className="page-head__eyebrow" style={{ marginBottom: 4 }}>
              <span className="vp-rule"/>Editor de Contrato
            </div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, textTransform: 'uppercase' }}>
              {contrato?.id || 'Novo Contrato'}
              <span style={{ marginLeft: 12, fontSize: 14, color: 'var(--fg3)', textTransform: 'none', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                {dados.razaoSocial || 'Sem cliente'} · {dados.propostaRef ? 'Proposta '+dados.propostaRef : 'Sem proposta'}
              </span>
            </h1>
          </div>
          <div className="row gap-2">
            <Button variant="ghost" size="sm" icon="save" onClick={() => save()} disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
            <Button variant="outline" size="sm" icon="download" onClick={() => { window.toast('Abrindo impressão — salve como PDF.','info'); setTimeout(() => window.print(), 200); }}>Gerar PDF</Button>
            <Button variant={preenchido ? 'primary' : 'outline'} size="sm" icon="signature"
              onClick={() => preenchido ? save('Em assinatura digital') : window.toast('Preencha Comprador, Objeto e Preço primeiro.','warning')}>
              Enviar p/ assinatura
            </Button>
          </div>
        </div>

        {/* TIPO TABS — Cliente | Montador */}
        <div className="pe__tabs" style={{ marginTop: 14, marginBottom: -16 }}>
          <button className={"pe__tab " + (tipoContrato === 'cliente' ? 'is-active' : '')}>
            <Icon.fileText size={18}/>
            <span>Contrato do Cliente</span>
            <span className="pe__tab-sub">COMPRA E VENDA · INSTALAÇÃO</span>
          </button>
          <button className={"pe__tab"} disabled style={{ opacity: .4, cursor: 'not-allowed' }}>
            <Icon.tool size={18}/>
            <span>Contrato do Montador</span>
            <span className="pe__tab-sub">EM BREVE</span>
          </button>
        </div>
      </div>

      {/* ===== BODY (pe layout) ===== */}
      <div className="pe">
        <div className="pe__main">

          {/* SIDENAV */}
          <nav className="pe__sidenav">
            <div className="pe__sidenav-progress">
              <div className="pe__sidenav-progress-lbl">Preenchimento</div>
              <div className="pe__sidenav-progress-val">{pct}%</div>
              <div className="progress"><span style={{ width: pct + '%' }}/></div>
              <div className="mono small" style={{ marginTop: 6, fontSize: 10, color: 'var(--fg3)' }}>
                {fDone}/{SECOES_CLIENTE.length} seções completas
              </div>
            </div>

            {Object.entries(groups).map(([g, items]) => (
              <div key={g}>
                <div className="pe__sidenav-group">{g}</div>
                {items.map(s => {
                  const fill = sectionFill(s.id, dados);
                  const I = Icon[s.icon] || Icon.file;
                  const isActive = activeSection === s.id;
                  const isDone   = fill === 'full';
                  return (
                    <div key={s.id}
                      className={"pe__sidenav-item " + (isActive ? 'is-active' : '') + (isDone && !isActive ? ' is-done' : '')}
                      onClick={() => jump(s.id)}>
                      <span className="pe__sidenav-icon">
                        {isDone ? <Icon.check/> : React.createElement(I)}
                      </span>
                      <span style={{ flex: 1 }}>{s.title}</span>
                      {fill === 'partial' && !isActive
                        ? <span className="mono small" style={{ fontSize: 9, color: 'var(--vp-warning-ink)' }}>parcial</span>
                        : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* FORM */}
          <div className="pe__form" ref={formRef}>
            <CSecao id="dados" num="01" title="Dados do Contrato" sub="IDENTIFICAÇÃO"
              fill={sectionFill('dados', dados)}
              collapsed={!!collapsed['dados']}
              onToggle={() => setCollapsed(c => ({ ...c, dados: !c.dados }))}>
              <SF_Dados dados={dados} set={set}/>
            </CSecao>

            <CSecao id="comprador" num="02" title="Comprador" sub="IDENTIFICAÇÃO"
              fill={sectionFill('comprador', dados)}
              collapsed={!!collapsed['comprador']}
              onToggle={() => setCollapsed(c => ({ ...c, comprador: !c.comprador }))}>
              <SF_Comprador dados={dados} set={set}/>
            </CSecao>

            <CSecao id="objeto" num="03" title="Objeto do Contrato" sub="ESCOPO"
              fill={sectionFill('objeto', dados)}
              collapsed={!!collapsed['objeto']}
              onToggle={() => setCollapsed(c => ({ ...c, objeto: !c.objeto }))}>
              <SF_Objeto dados={dados} set={set}/>
            </CSecao>

            <CSecao id="preco" num="04" title="Preço e Pagamento" sub="COMERCIAL"
              fill={sectionFill('preco', dados)}
              collapsed={!!collapsed['preco']}
              onToggle={() => setCollapsed(c => ({ ...c, preco: !c.preco }))}>
              <SF_Preco dados={dados} set={set} setParcela={setParcela} addParcela={addParcela} removeParcela={removeParcela}/>
            </CSecao>

            <CSecao id="assinatura" num="05" title="Assinatura das Partes" sub="FORMALIZAÇÃO"
              fill={sectionFill('assinatura', dados)}
              collapsed={!!collapsed['assinatura']}
              onToggle={() => setCollapsed(c => ({ ...c, assinatura: !c.assinatura }))}>
              <SF_Assinatura dados={dados} set={set}/>
            </CSecao>

            <div className="pe__actionbar">
              <span className="pe__autosave">
                <span className="dot"/> Salvo · {Math.max(0, Math.floor((Date.now()-savedAt)/1000))}s atrás
              </span>
              <div className="spacer" style={{ flex: 1 }}/>
              <Button variant="ghost" size="sm" icon="chevLeft" onClick={() => setRoute('juridico')}>Voltar</Button>
              <Button variant="outline" size="sm" icon="download"
                onClick={() => { window.toast('Abrindo diálogo de impressão…','info'); setTimeout(() => window.print(), 200); }}>
                Gerar PDF
              </Button>
              <Button variant="secondary" size="sm" icon="save" onClick={() => save()} disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar rascunho'}
              </Button>
              <Button variant="primary" size="sm" icon="signature"
                onClick={() => preenchido ? save('Em assinatura digital') : window.toast('Preencha todos os campos obrigatórios.','warning')}>
                Enviar p/ Cliente
              </Button>
            </div>
          </div>
        </div>

        {/* PREVIEW */}
        <ContratoPreviewPanel dados={dados} status={contrato?.status} onSign={() => save('Assinado')}/>
      </div>
    </div>
  );
}

/* ---------- CSecao — igual ao PESection do PropostaEditor ---------- */
function CSecao({ id, num, title, sub, fill, collapsed, onToggle, children }) {
  const fillColor = fill === 'full' ? 'var(--vp-success)' : fill === 'partial' ? 'var(--vp-warning-ink)' : 'var(--border-strong)';
  return (
    <div className="pe__section" id={'csec-' + id}>
      <div className="pe__section-head" onClick={onToggle} style={{ cursor: 'pointer' }}>
        <span className="pe__section-num">{num}</span>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          {sub && <div className="pe__section-sub">{sub}</div>}
        </div>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: fillColor, flexShrink: 0 }}/>
        {React.createElement(collapsed ? Icon.chevDown : Icon.chevUp, { size: 14, color: 'var(--fg3)' })}
      </div>
      {!collapsed && <div style={{ padding: '20px 24px 24px' }}>{children}</div>}
    </div>
  );
}

/* ---------- Sub-formulários ---------- */
function SF_Dados({ dados, set }) {
  return (
    <div className="stack" style={{ gap: 14 }}>
      <Field label="Nº do Contrato *" value={dados.numero} onChange={v => set('numero', v)} ph="CTR-001/2026"/>
      <div className="grid-2" style={{ gap: 12 }}>
        <Field label="Data de emissão" type="date" value={dados.dataEmissao} onChange={v => set('dataEmissao', v)}/>
        <Field label="Proposta de referência" value={dados.propostaRef} onChange={v => set('propostaRef', v)} ph="PR-2026-001"/>
      </div>
      <Field label="Advogado responsável" value={dados.advogado} onChange={v => set('advogado', v)} ph="Nome do advogado"/>
    </div>
  );
}

function SF_Comprador({ dados, set }) {
  return (
    <div className="stack" style={{ gap: 14 }}>
      <Field label="Razão Social *" value={dados.razaoSocial} onChange={v => set('razaoSocial', v)} ph="EMPRESA LTDA"/>
      <Field label="CNPJ *" value={dados.cnpj} onChange={v => set('cnpj', v)} ph="XX.XXX.XXX/XXXX-XX"/>
      <div className="pe__section-sub" style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--fg3)', marginTop: 4 }}>Endereço da Empresa</div>
      <div className="grid-2" style={{ gap: 12 }}>
        <Field label="Logradouro *" value={dados.logradouro} onChange={v => set('logradouro', v)} ph="Rua, Av…"/>
        <Field label="Número" value={dados.numero_end} onChange={v => set('numero_end', v)} ph="123"/>
      </div>
      <div className="grid-3" style={{ gap: 12 }}>
        <Field label="Bairro" value={dados.bairro} onChange={v => set('bairro', v)}/>
        <Field label="Cidade" value={dados.cidade} onChange={v => set('cidade', v)}/>
        <FieldSel label="UF" value={dados.estado} options={UF_LIST} onChange={v => set('estado', v)}/>
      </div>
      <Field label="CEP" value={dados.cep} onChange={v => set('cep', v)} ph="XX.XXX-XX"/>
      <div className="pe__section-sub" style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--fg3)', marginTop: 4 }}>Representante Legal</div>
      <Field label="Nome do Responsável *" value={dados.responsavel} onChange={v => set('responsavel', v)}/>
      <div className="grid-3" style={{ gap: 12 }}>
        <Field label="Nacionalidade" value={dados.nacionalidade} onChange={v => set('nacionalidade', v)}/>
        <Field label="Estado Civil" value={dados.estadoCivil} onChange={v => set('estadoCivil', v)}/>
        <Field label="Profissão" value={dados.profissao} onChange={v => set('profissao', v)}/>
      </div>
      <div className="grid-2" style={{ gap: 12 }}>
        <Field label="RG" value={dados.rg} onChange={v => set('rg', v)} ph="XX.XXX.XXX-X"/>
        <Field label="CPF *" value={dados.cpf} onChange={v => set('cpf', v)} ph="XXX.XXX.XXX-XX"/>
      </div>
    </div>
  );
}

function SF_Objeto({ dados, set }) {
  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="grid-2" style={{ gap: 12 }}>
        <Field label="Quantidade *" type="number" value={dados.qtdEquip} onChange={v => set('qtdEquip', v)} ph="1"/>
        <Field label="Proposta Comercial ref." value={dados.propostaRef} onChange={v => set('propostaRef', v)} ph="PR-2026-001"/>
      </div>
      <div>
        <label className="up-eyebrow muted" style={{ fontSize: 11, display: 'block', marginBottom: 5 }}>Descrição do Equipamento * (conforme Proposta e Anexo I e II)</label>
        <textarea className="input" rows={3} value={dados.modeloEquip}
          onChange={e => set('modeloEquip', e.target.value)}
          placeholder="Ex.: Escada Rolante OAK 30°, largura 1000mm, modalidade CIF, velocidade 0,5m/s…"
          style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}/>
      </div>
      <div className="pe__section-sub" style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--fg3)', marginTop: 4 }}>Local de Entrega / Obra</div>
      <div className="grid-2" style={{ gap: 12 }}>
        <Field label="Logradouro *" value={dados.entregaRua} onChange={v => set('entregaRua', v)} ph="Av., Rua…"/>
        <Field label="Número" value={dados.entregaNum} onChange={v => set('entregaNum', v)}/>
      </div>
      <div className="grid-3" style={{ gap: 12 }}>
        <Field label="Bairro" value={dados.entregaBairro} onChange={v => set('entregaBairro', v)}/>
        <Field label="Cidade" value={dados.entregaCidade} onChange={v => set('entregaCidade', v)}/>
        <FieldSel label="UF" value={dados.entregaEstado} options={UF_LIST} onChange={v => set('entregaEstado', v)}/>
      </div>
    </div>
  );
}

function SF_Preco({ dados, set, setParcela, addParcela, removeParcela }) {
  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="grid-2" style={{ gap: 12 }}>
        <Field label="Valor Total (R$) *" value={dados.valorTotal} onChange={v => set('valorTotal', v)} ph="1.200.000,00"/>
        <Field label="Valor por extenso *" value={dados.valorExtenso} onChange={v => set('valorExtenso', v)} ph="um milhão, duzentos mil reais"/>
      </div>
      <div>
        <div className="up-eyebrow muted" style={{ fontSize: 11, marginBottom: 8 }}>Cronograma de Pagamento</div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px 140px 32px', gap: 0, background: 'var(--vp-gray-50)', padding: '6px 10px', fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--fg3)', borderBottom: '1px solid var(--border)' }}>
            <span>Descrição</span><span>%</span><span>Valor</span><span/>
          </div>
          {dados.parcelas.map((p, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 64px 140px 32px', gap: 0, borderBottom: i < dados.parcelas.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
              <input className="input" style={{ border: 'none', borderRadius: 0, fontSize: 12 }} value={p.desc} onChange={e => setParcela(i,'desc',e.target.value)} placeholder="Descrição"/>
              <input className="input" style={{ border: 'none', borderLeft: '1px solid var(--border)', borderRadius: 0, fontSize: 12, textAlign: 'center' }} value={p.pct} onChange={e => setParcela(i,'pct',e.target.value)} placeholder="%"/>
              <input className="input" style={{ border: 'none', borderLeft: '1px solid var(--border)', borderRadius: 0, fontSize: 12 }} value={p.valor} onChange={e => setParcela(i,'valor',e.target.value)} placeholder="R$ 0,00"/>
              {dados.parcelas.length > 1
                ? <button onClick={() => removeParcela(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--fg3)', fontSize: 16, borderLeft: '1px solid var(--border)', height: '100%' }}>×</button>
                : <span/>}
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" icon="plus" onClick={addParcela} style={{ marginTop: 8 }}>Adicionar parcela</Button>
      </div>
    </div>
  );
}

function SF_Assinatura({ dados, set }) {
  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="grid-2" style={{ gap: 12 }}>
        <Field label="Cidade de assinatura" value={dados.cidadeAss} onChange={v => set('cidadeAss', v)} ph="São Paulo"/>
        <Field label="Data da assinatura" type="date" value={dados.dataAss} onChange={v => set('dataAss', v)}/>
      </div>
      <div className="pe__section-sub" style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--fg3)' }}>Testemunhas</div>
      <div className="grid-2" style={{ gap: 12 }}>
        <Field label="Testemunha 1 — Nome" value={dados.test1Nome} onChange={v => set('test1Nome', v)}/>
        <Field label="Testemunha 1 — CPF" value={dados.test1Cpf} onChange={v => set('test1Cpf', v)} ph="XXX.XXX.XXX-XX"/>
      </div>
      <div className="grid-2" style={{ gap: 12 }}>
        <Field label="Testemunha 2 — Nome" value={dados.test2Nome} onChange={v => set('test2Nome', v)}/>
        <Field label="Testemunha 2 — CPF" value={dados.test2Cpf} onChange={v => set('test2Cpf', v)} ph="XXX.XXX.XXX-XX"/>
      </div>
    </div>
  );
}

/* ---------- Preview panel (lado direito) ---------- */
function ContratoPreviewPanel({ dados, status, onSign }) {
  const fill = (v, fb) => v ? <b>{v}</b> : <span style={{ color: 'var(--vp-danger)', fontStyle: 'italic', fontSize: 10 }}>{fb}</span>;
  const fb   = (v, def) => v || def;
  const endEmp  = [dados.logradouro, dados.numero_end, dados.bairro, dados.cidade, dados.estado].filter(Boolean).join(', ') || '___';
  const endEntr = [dados.entregaRua, dados.entregaNum, dados.entregaBairro, dados.entregaCidade, dados.entregaEstado].filter(Boolean).join(', ') || '___';

  return (
    <div style={{ width: 300, background: 'var(--vp-gray-50)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', background: '#fff', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--fg3)' }}>Preview do Contrato</span>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg3)' }}>ELEVADOR</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {/* Mini contract card */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', padding: '16px 14px', fontSize: 11, lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
          <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8, borderBottom: '2px solid var(--vp-yellow)', paddingBottom: 6 }}>
            CONTRATO DE COMPRA E VENDA
          </div>
          <p style={{ margin: '0 0 4px', fontSize: 10 }}>
            <b>Nº:</b> {fb(dados.numero, '___')} &nbsp;·&nbsp; <b>Data:</b> {dataBR(dados.dataEmissao).substring(0,10)}
          </p>
          <p style={{ margin: '0 0 6px', fontSize: 10, color: 'var(--fg3)' }}>Proposta ref.: {fb(dados.propostaRef,'—')}</p>

          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--fg3)', margin: '10px 0 4px', borderLeft: '3px solid var(--vp-yellow)', paddingLeft: 6 }}>COMPRADOR</div>
          <p style={{ margin: '0 0 4px', fontSize: 10 }}>{fill(dados.razaoSocial,'RAZÃO SOCIAL')}</p>
          <p style={{ margin: '0 0 4px', fontSize: 10 }}>CNPJ: {fill(dados.cnpj,'XX.XXX.XXX/XXXX-XX')}</p>
          <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--fg3)' }}>{endEmp}</p>
          <p style={{ margin: '0 0 4px', fontSize: 10 }}>Rep.: {fill(dados.responsavel,'___')} · CPF: {fb(dados.cpf,'___')}</p>

          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--fg3)', margin: '10px 0 4px', borderLeft: '3px solid var(--vp-yellow)', paddingLeft: 6 }}>OBJETO</div>
          <p style={{ margin: '0 0 4px', fontSize: 10 }}>{fb(dados.qtdEquip,'?')}× {fill(dados.modeloEquip,'MODELO NÃO PREENCHIDO')}</p>
          <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--fg3)' }}>Entrega: {endEntr}</p>

          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--fg3)', margin: '10px 0 4px', borderLeft: '3px solid var(--vp-yellow)', paddingLeft: 6 }}>VALOR</div>
          <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 800 }}>{dados.valorTotal ? `R$ ${dados.valorTotal}` : fill(null,'R$ ___')}</p>
          <p style={{ margin: '0 0 8px', fontSize: 10, color: 'var(--fg3)', fontStyle: 'italic' }}>{fb(dados.valorExtenso,'valor por extenso')}</p>

          {dados.parcelas.map((p,i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, padding: '2px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--fg2)' }}>{p.desc}</span>
              <b>{p.valor ? `R$ ${p.valor}` : '—'}</b>
            </div>
          ))}

          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--fg3)', margin: '10px 0 4px', borderLeft: '3px solid var(--vp-yellow)', paddingLeft: 6 }}>ASSINATURA</div>
          <p style={{ margin: '0 0 4px', fontSize: 10 }}>{fb(dados.cidadeAss,'___')}, {dataBR(dados.dataAss)}</p>
          <div style={{ marginTop: 12 }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: 4, marginBottom: 8, fontSize: 9 }}>VERTICAL PARTS — Diego Y. Maeno</div>
            <div style={{ borderTop: '1px solid #000', paddingTop: 4, fontSize: 9 }}>{fb(dados.razaoSocial,'COMPRADOR')} — {fb(dados.responsavel,'___')}</div>
          </div>
        </div>

        {/* Assinatura status */}
        {status === 'Em assinatura digital' && (
          <div style={{ marginTop: 12 }}>
            <div className="alert" style={{ background: 'var(--vp-yellow-50)', borderLeft: '3px solid var(--vp-yellow)', fontSize: 12, padding: '10px 12px' }}>
              ✉️ Aguardando assinatura do cliente
            </div>
            <Button variant="outline" size="sm" icon="check" onClick={onSign} style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
              Marcar como assinado
            </Button>
            <p className="small muted" style={{ marginTop: 4, fontSize: 10, textAlign: 'center' }}>Use quando receber confirmação</p>
          </div>
        )}
        {status === 'Assinado' && (
          <div className="alert success" style={{ marginTop: 12, fontSize: 12 }}>
            <Icon.check size={14}/> Assinado — fase de Compra liberada
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Primitivos de campo ---------- */
function Field({ label, value, onChange, type='text', ph='' }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input className="input" type={type} value={value} placeholder={ph} onChange={e => onChange(e.target.value)}/>
    </div>
  );
}
function FieldSel({ label, value, options, onChange }) {
  return (
    <div className="field">
      <label>{label}</label>
      <select className="input" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

Object.assign(window, { ContratoEditorPage });
