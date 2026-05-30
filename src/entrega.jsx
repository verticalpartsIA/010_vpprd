/* ============================================================
   entrega.jsx — Etapas finais do workflow (pós-instalação)
   ART · Cronograma · Data Book / Termo de Conclusão
   Telas placeholder (estrutura definida; conteúdo a implementar).
   ============================================================ */

function PlaceholderPage({ eyebrow, title, sub, planned = [], cta }) {
  return (
    <div className="page fade-in">
      <div className="page-head">
        <div className="page-head__l">
          <div className="page-head__eyebrow"><span className="vp-rule"/>{eyebrow}</div>
          <h1 className="page-head__title">{title}</h1>
          <p className="page-head__sub">{sub}</p>
        </div>
        {cta ? (
          <div className="page-head__r">
            <Button variant="primary" icon="plus" onClick={() => window.toast('Tela em construção — em breve.', 'info')}>{cta}</Button>
          </div>
        ) : null}
      </div>

      <div style={{
        border: '1px dashed var(--border)', background: 'var(--vp-gray-50)',
        padding: '40px 32px', textAlign: 'center', maxWidth: 760, margin: '8px auto 0',
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--vp-warning-ink)', marginBottom: 8 }}>
          Em construção
        </div>
        <p style={{ fontSize: 13, color: 'var(--fg2)', maxWidth: 520, margin: '0 auto 20px' }}>
          Esta etapa do workflow já tem o lugar reservado no fluxo. O conteúdo operacional será implementado na próxima fase.
        </p>
        {planned.length ? (
          <div style={{ display: 'inline-block', textAlign: 'left' }}>
            <div className="up-eyebrow muted" style={{ marginBottom: 8 }}>Conteúdo planejado</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--fg1)', lineHeight: 1.9 }}>
              {planned.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ArtPage() {
  return (
    <PlaceholderPage
      eyebrow="Instalação & Entrega · ART"
      title="ART de Instalação"
      sub="Anotação de Responsabilidade Técnica — obrigatória antes do início da instalação."
      cta="Nova ART"
      planned={[
        'Emissão e vínculo da ART por projeto (responsável técnico / CREA)',
        'Upload do comprovante e número da ART',
        'Bloqueio da etapa de instalação enquanto a ART não estiver registrada',
        'Histórico e situação (emitida, paga, baixada)',
      ]}
    />
  );
}

function CronogramaPage() {
  return (
    <PlaceholderPage
      eyebrow="Instalação & Entrega · Cronograma"
      title="Cronograma de Instalação"
      sub="Planejamento de etapas em campo. Elevadores e escadas/esteiras têm fluxos distintos."
      cta="Novo cronograma"
      planned={[
        'Linha do tempo por projeto com marcos e responsáveis',
        'Fluxo de elevador (montagem de guias, cabina, portas por parada) vs. escada/esteira',
        'Dependência da chegada dos componentes importados',
        'SLA, atrasos e replanejamento',
      ]}
    />
  );
}

function DataBookPage() {
  return (
    <PlaceholderPage
      eyebrow="Instalação & Entrega · Encerramento"
      title="Data Book & Termo de Conclusão"
      sub="Documentação técnica final e entrega formal ao cliente."
      cta="Gerar Data Book"
      planned={[
        'Compilação do Data Book (manuais, certificados, ART, laudos)',
        'Termo de conclusão de obra e entrega técnica',
        'Assinatura digital do cliente',
        'Disparo do pós-venda e gatilhos financeiros finais',
      ]}
    />
  );
}

Object.assign(window, { ArtPage, CronogramaPage, DataBookPage });
