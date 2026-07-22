/* ============================================================
   enderecos-api.js — Consulta de CEP (BrasilAPI, com fallback ViaCEP)
   e CNPJ (BrasilAPI), pra autopreencher endereço/dados fiscais nos
   formulários. Sem build step — plain JS, expõe window.EnderecoAPI.
   ============================================================ */
(function () {
  'use strict';

  function sanitizeDigits(v) {
    return (v || '').replace(/\D/g, '');
  }
  function isCepValido(cep) { return sanitizeDigits(cep).length === 8; }
  function isCnpjValido(cnpj) { return sanitizeDigits(cnpj).length === 14; }

  async function fetchComTimeout(url, ms) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      return await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  function normalizarCepBrasilApi(d) {
    return {
      cep: sanitizeDigits(d.cep),
      logradouro: d.street || '',
      bairro: d.neighborhood || '',
      cidade: d.city || '',
      estado: d.state || '',
    };
  }
  function normalizarCepViaCep(d) {
    return {
      cep: sanitizeDigits(d.cep),
      logradouro: d.logradouro || '',
      bairro: d.bairro || '',
      cidade: d.localidade || '',
      estado: d.uf || '',
    };
  }

  async function buscarCepViaCep(cep) {
    const res = await fetchComTimeout(`https://viacep.com.br/ws/${cep}/json/`, 3000);
    if (!res.ok) throw new Error('CEP não encontrado.');
    const data = await res.json();
    if (data.erro) throw new Error('CEP não encontrado.');
    return normalizarCepViaCep(data);
  }

  /* Principal: BrasilAPI v2. Qualquer erro de rede, HTTP não-ok ou timeout
     (>3s) cai automaticamente pro fallback ViaCEP antes de desistir. */
  async function buscarCEP(cepRaw) {
    const cep = sanitizeDigits(cepRaw);
    if (!isCepValido(cep)) throw new Error('CEP inválido — informe 8 dígitos.');
    try {
      const res = await fetchComTimeout(`https://brasilapi.com.br/api/cep/v2/${cep}`, 3000);
      if (!res.ok) return await buscarCepViaCep(cep);
      return normalizarCepBrasilApi(await res.json());
    } catch (e) {
      return await buscarCepViaCep(cep);
    }
  }

  function montarLogradouro(d) {
    const via = [d.descricao_tipo_logradouro, d.logradouro].filter(Boolean).join(' ').trim();
    if (via && d.numero) return `${via}, ${d.numero}`;
    return via || d.numero || '';
  }

  async function buscarCNPJ(cnpjRaw) {
    const cnpj = sanitizeDigits(cnpjRaw);
    if (!isCnpjValido(cnpj)) throw new Error('CNPJ inválido — informe 14 dígitos.');
    let res;
    try {
      res = await fetchComTimeout(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, 5000);
    } catch (e) {
      throw new Error('Serviço de consulta de CNPJ temporariamente indisponível.');
    }
    if (res.status === 404) throw new Error('CNPJ não encontrado.');
    if (!res.ok) throw new Error('Serviço de consulta de CNPJ temporariamente indisponível.');
    const d = await res.json();
    const descSituacao = d.descricao_situacao_cadastral || '';
    return {
      cnpj: d.cnpj || cnpj,
      razao_social: d.razao_social || '',
      nome_fantasia: d.nome_fantasia || '',
      situacao_cadastral: descSituacao,
      status: /ativa/i.test(descSituacao) ? 'ativo' : 'inativo',
      telefone: d.ddd_telefone_1 || '',
      endereco: {
        logradouro: montarLogradouro(d),
        complemento: d.complemento || '',
        bairro: d.bairro || '',
        cep: sanitizeDigits(d.cep),
        cidade: d.municipio || '',
        estado: d.uf || '',
      },
      cnaes: {
        principal: d.cnae_fiscal ? { codigo: d.cnae_fiscal, descricao: d.cnae_fiscal_descricao || '' } : null,
        secundarios: Array.isArray(d.cnaes_secundarios)
          ? d.cnaes_secundarios.map((c) => ({ codigo: c.codigo, descricao: c.descricao }))
          : [],
      },
    };
  }

  window.EnderecoAPI = { sanitizeDigits, isCepValido, isCnpjValido, buscarCEP, buscarCNPJ };
})();
