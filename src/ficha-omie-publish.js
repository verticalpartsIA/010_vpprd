/* ============================================================
   ficha-omie-publish.js — Publicar ficha técnica no Omie
   Gera PDF da pré-visualização e envia como anexo do produto
   no Omie via Edge Function (Supabase) publicar_ficha_omie.
   window.FichaOmiePublish
   ============================================================ */
(function () {
  'use strict';

  function sb() { return (window.__VP_SB || {}).sb; }

  /* Gera o PDF da ficha a partir da pré-visualização (mesma técnica
     do botão "Salvar PDF": html2canvas → jsPDF, 1 página A4). */
  async function gerarPdfBase64() {
    if (!window.html2canvas || !window.jspdf) {
      throw new Error('Bibliotecas de PDF ainda carregando — tente de novo em 2s');
    }
    const el = document.querySelector('.ft-ficha-overlay .ft-ficha')
      || document.querySelector('.ft-previewcol .ft-ficha')
      || document.querySelector('.ft-ficha');
    if (!el) throw new Error('Pré-visualização da ficha não encontrada na tela');

    const ori = el.getAttribute('data-orientation') || 'landscape';
    const canvas = await window.html2canvas(el, {
      scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false,
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: ori, compress: true });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'JPEG', 0, 0, pw, ph, undefined, 'FAST');
    // dataurlstring → "data:application/pdf;...;base64,XXXX"
    return pdf.output('datauristring').split('base64,')[1];
  }

  let busy = false; // trava cliques duplos — o Omie rejeita chamadas repetidas (<60s)

  async function publicarNoOmie(fichaId, nomeProduto, atorNome, atorSetor) {
    if (busy) { window.toast?.('Aguarde — publicação em andamento…', 'info'); return; }
    const c = sb();
    if (!c) { window.toast?.('Supabase indisponível', 'error'); throw new Error('Supabase indisponível'); }
    if (!fichaId) {
      window.toast?.('Salve a ficha antes de publicar no Omie', 'error');
      throw new Error('Ficha ainda não salva');
    }
    busy = true;
    try {
      return await doPublicar(c, fichaId, atorNome, atorSetor);
    } finally { busy = false; }
  }

  async function doPublicar(c, fichaId, atorNome, atorSetor) {

    window.toast?.('Gerando PDF da ficha…', 'info');
    const pdfBase64 = await gerarPdfBase64();

    window.toast?.('Enviando para o Omie…', 'info');
    const { data, error } = await c.functions.invoke('publicar_ficha_omie', {
      body: {
        ficha_id: fichaId,
        pdf_base64: pdfBase64,
        ator_nome: atorNome || 'Usuário',
        ator_setor: atorSetor || 'engenharia',
      },
    });

    if (error) {
      // FunctionsHttpError: o corpo da resposta tem a mensagem real
      let msg = error.message || 'Erro ao publicar';
      try {
        const body = await error.context?.json?.();
        if (body && body.error) msg = body.error;
      } catch (e) { /* mantém msg */ }
      window.toast?.(msg, 'error');
      throw new Error(msg);
    }
    if (data && data.error) {
      window.toast?.(data.error, 'error');
      throw new Error(data.error);
    }

    window.toast?.(data?.mensagem || '✅ Ficha publicada no Omie!', 'success');
    return data;
  }

  window.FichaOmiePublish = { publicarNoOmie, gerarPdfBase64 };
}());
