/* ============================================================
   ficha-omie-publish.js — Publicar ficha técnica no Omie
   Gera PDF e envia como anexo para o Omie via Edge Function
   ============================================================ */
(function () {
  'use strict';

  async function publicarNoOmie(fichaId, nomeProduto, atorNome, atorSetor) {
    try {
      // 1. Gerar PDF da ficha (usa html2canvas + jsPDF — já carregados)
      window.toast?.('Gerando PDF da ficha…', 'info');

      const ftPanel = document.querySelector('.ft-panel-content');
      if (!ftPanel) {
        throw new Error('Painel de ficha técnica não encontrado');
      }

      // Usar html2canvas para capturar o painel
      const canvas = await html2canvas(ftPanel, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      // Converter para PDF A4 (1 página)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL('image/png');

      // Escalar a imagem para caber no A4
      const ratio = canvas.width / canvas.height;
      const imgWidth = pdfWidth;
      const imgHeight = imgWidth / ratio;

      if (imgHeight > pdfHeight) {
        // Se passar da altura, reduzir largura proporcionalmente
        const newWidth = pdfHeight * ratio;
        pdf.addImage(imgData, 'PNG', (pdfWidth - newWidth) / 2, 0, newWidth, pdfHeight);
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      }

      // Converter PDF para base64
      const pdfBase64 = pdf.output('dataurlstring').split('base64,')[1];

      window.toast?.('Enviando para o Omie…', 'info');

      // 2. Chamar Edge Function
      const edgeUrl = `${window.location.origin}/.netlify/functions/publicar_ficha_omie`;
      const response = await fetch(edgeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ficha_id: fichaId,
          pdf_base64: pdfBase64,
          ator_nome: atorNome || 'Usuário',
          ator_setor: atorSetor || 'engenharia',
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Erro ao publicar');
      }

      window.toast?.(result.mensagem || '✅ Ficha publicada no Omie!', 'success');
      console.log('Sucesso:', result);
      return result;
    } catch (err) {
      console.error('Erro ao publicar no Omie:', err);
      window.toast?.(`❌ ${err.message}`, 'error');
      throw err;
    }
  }

  window.FichaOmiePublish = {
    publicarNoOmie,
  };
}());
