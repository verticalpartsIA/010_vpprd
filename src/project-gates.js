/* ============================================================
   project-gates.js
   Validação de gatilhos críticos antes de iniciar importação.
   Gate AND Logic: [Contrato Assinado] AND [Pagamento F1] AND [PDF Projeto]
   window.ProjectGates — expõe validação de gates
   ============================================================ */
(function () {
  'use strict';

  function sb() { return (window.__VP_SB || {}).sb; }

  /* Valida os 3 gatilhos críticos para um project_id
     Retorna: { ok: boolean, gates: [...], blockedBy: [...] } */
  async function validarGatesImportacao(projectId) {
    const c = sb();
    if (!c || !projectId) {
      return { ok: false, gates: [], blockedBy: ['Sistema indisponível ou project_id inválido'], erro: true };
    }

    const gates = [];
    const blockedBy = [];

    try {
      // 1. CONTRATO ASSINADO
      const { data: contratos } = await c
        .from('contratos_venda_equipamentos')
        .select('id, status')
        .eq('project_id', projectId)
        .limit(1);

      const contratoAssinado = contratos && contratos.length > 0 && contratos[0].status === 'assinado';
      gates.push({
        nome: 'Contrato Assinado',
        ok: contratoAssinado,
        descricao: contratoAssinado ? '✅ Cliente assinou' : '❌ Aguardando assinatura do cliente',
      });
      if (!contratoAssinado) blockedBy.push('contrato_nao_assinado');

      // 2. PAGAMENTO F1 LIBERADO
      const { data: cronograma } = await c
        .from('instalacao_cronograma')
        .select('id, f1_status')
        .eq('endereco', projectId) // ou poderia ser project_id, depende da tabela
        .limit(1);

      const pagamentoLiberado = cronograma && cronograma.length > 0 && cronograma[0].f1_status === 'Liberada';
      gates.push({
        nome: 'Pagamento F1',
        ok: pagamentoLiberado,
        descricao: pagamentoLiberado ? '✅ Entrada (F1) foi liberada' : '❌ Aguardando confirmação de pagamento',
      });
      if (!pagamentoLiberado) blockedBy.push('pagamento_f1_pendente');

      // 3. PDF PROJETO RECEBIDO
      const { data: equipamentos } = await c
        .from('equipamentos_spec')
        .select('id, projeto_pdf_recebido, anexos')
        .eq('project_id', projectId)
        .limit(1);

      const pdfRecebido = equipamentos && equipamentos.length > 0 && (
        equipamentos[0].projeto_pdf_recebido === true ||
        (equipamentos[0].anexos && equipamentos[0].anexos.projeto_pdf)
      );
      gates.push({
        nome: 'PDF Projeto',
        ok: pdfRecebido,
        descricao: pdfRecebido ? '✅ Projeto (EN+ZH) foi recebido' : '❌ Aguardando envio do PDF do projeto',
      });
      if (!pdfRecebido) blockedBy.push('pdf_projeto_nao_recebido');

      // DECISÃO FINAL
      const ok = gates.every((g) => g.ok);

      return {
        ok,
        gates,
        blockedBy,
        projectId,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.error('[ProjectGates] validarGatesImportacao falhou', err);
      return {
        ok: false,
        gates: [],
        blockedBy: ['Erro ao validar gatilhos'],
        erro: true,
        detalhe: err.message,
      };
    }
  }

  /* Formata mensagem amigável dos gates bloqueadores */
  function mensagemBlockedBy(blockedBy) {
    const msgs = {
      contrato_nao_assinado: '📝 Cliente ainda não assinou o contrato',
      pagamento_f1_pendente: '💳 Entrada (F1) ainda não foi confirmada',
      pdf_projeto_nao_recebido: '📄 PDF do projeto (EN+ZH) ainda não foi enviado',
    };
    return blockedBy
      .filter((b) => msgs[b])
      .map((b) => msgs[b])
      .join('\n');
  }

  // Exporta globalmente
  window.ProjectGates = {
    validarGatesImportacao,
    mensagemBlockedBy,
  };
})();
