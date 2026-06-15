# Relatório de Desenvolvimento — 12/06/2026

**Projeto:** VP PRD — VP Gestão (vpprd.vpsistema.com)
**Repositório:** https://github.com/verticalpartsIA/vpprd
**Sessão:** Continuação da sessão de 10/06/2026

---

## Resumo Executivo

Esta sessão foi inteiramente dedicada a depurar e finalizar a funcionalidade de **publicação da Ficha Técnica como anexo PDF no Omie ERP**, iniciada na sessão anterior. O botão "Publicar no Omie" foi implementado na sessão anterior, mas apresentava múltiplos problemas que foram resolvidos iterativamente nesta sessão, guiados pelos erros retornados ao vivo pela API do Omie.

---

## Funcionalidade: Publicar Ficha Técnica no Omie

### Objetivo
Ao clicar em **"Publicar no Omie"** dentro do editor da Ficha Técnica, o sistema deve:
1. Gerar um PDF da ficha a partir da pré-visualização em tela
2. Enviar o PDF como **anexo** ao produto correspondente no Omie ERP (identificado pelo campo `codigo_produto` da ficha)
3. **Não tocar** em nenhum dado do produto (NCM, código, preço, etc.) — apenas anexar o arquivo

### Arquitetura
- **Cliente:** `src/ficha-omie-publish.js` — gera o PDF via `html2canvas + jsPDF` e invoca a Edge Function via `supabase.functions.invoke()`
- **Servidor:** `supabase/functions/publicar_ficha_omie/index.ts` — valida o produto no Omie (`ConsultarProduto`) e sobe o PDF (`IncluirAnexo`)
- **API Omie:** JSON-RPC em `https://app.omie.com.br/api/v1/geral/`

---

## Problemas Resolvidos (em ordem cronológica)

### 1. Botão "Publicar no Omie" sempre cinza/desabilitado
**Causa:** O botão exigia `podeGerar` (que requer nome + pelo menos 1 campo técnico ativo com valor preenchido). Fichas com apenas os campos de identificação preenchidos ficavam com o botão desabilitado mesmo com `codigoProduto` preenchido.

**Correção:** Removida a dependência de `podeGerar` do botão Omie. O requisito mínimo passou a ser apenas `state.identificacao.codigoProduto` estar preenchido. A verificação de "ficha salva" (`fichaId`) é feita no momento do clique com toast explicativo.

**Arquivo:** `src/ficha-tecnica.jsx` (v14 → v15) · Commit: `f82b502`

---

### 2. Campo `cCodIntAnexo` excedia o limite do Omie
**Erro:** `"O número máximo de caracteres permitido para o elemento [CCODINTANEXO] é de 20. O número de caracteres informado foi de 39!"`

**Causa:** Estávamos enviando `ft-{UUID}` completo, totalizando 39 caracteres.

**Correção:** `ft-` (3 chars) + UUID sem hífens truncado a 17 chars = exatamente 20 chars.
```typescript
cCodIntAnexo: `ft-${String(ficha_id).replace(/-/g, '').slice(0, 17)}`
```

**Arquivo:** `supabase/functions/publicar_ficha_omie/index.ts` · Commit: `efd1554`

---

### 3. Descoberta dos requisitos reais do `IncluirAnexo` (leitura da documentação)
Ao ler a documentação oficial em `https://app.omie.com.br/api/v1/geral/anexo/#docIncluirAnexoRequest`, descobrimos dois requisitos **não implementados**:

| Campo | Requisito |
|---|---|
| `cArquivo` | Arquivo deve ser **comprimido em ZIP** antes de converter para base64 |
| `cMd5` | Hash **MD5 obrigatório** do arquivo |

**Correção:** Adicionada compressão ZIP via `fflate` e cálculo do MD5 via `node:crypto`.
```typescript
import { zipSync } from "https://esm.sh/fflate@0.8.2";
import { createHash } from "node:crypto";

const zipped = zipSync({ [nomeArquivo]: pdfBytes });
const zippedBase64 = toBase64(zipped);
const md5Hash = createHash("md5").update(zippedBase64).digest("hex");
```

**Arquivo:** `supabase/functions/publicar_ficha_omie/index.ts` · Commit: `c719d46`

---

### 4. `cTabela` com valor incorreto
**Erro:** `"O preenchimento inválido da tag [cTabela]! Valores permitidos: 'cliente', 'produto', 'servico'..."`

**Causa:** Estávamos enviando `cTabela: "produtos"` (plural), mas o Omie aceita apenas `"produto"` (singular).

**Correção:** `cTabela: "produto"` · Commit: `d2e10da`

---

### 5. `cMd5` calculado sobre o objeto errado (3 tentativas)
O Omie retornava o hash que ele calculava vs. o que enviávamos, o que permitiu depuração sistemática:

| Tentativa | O que hashamos | Resultado |
|---|---|---|
| v1 | Bytes do PDF original | ❌ MD5 errado |
| v2 | Bytes do ZIP | ❌ MD5 errado |
| v3 | **String base64 de `cArquivo`** | ✅ MD5 aceito |

O Omie calcula o MD5 sobre a **string base64** presente no campo `cArquivo`, não sobre os bytes binários.

```typescript
// Correto:
const md5Hash = createHash("md5").update(zippedBase64).digest("hex");
```

Commits: `06da463`, `88d15fc`

---

### 6. PDF sendo gerado a partir da miniatura do preview (zoom ~0.42)
**Sintoma:** PDF foi aceito pelo Omie, mas o conteúdo chegou com texto sobreposto e distorcido — a miniatura escalada estava sendo capturada pelo `html2canvas`.

**Causa:** O seletor `'.ft-previewcol .ft-ficha'` aponta para o elemento dentro do `.ft-preview-scaler` que tem `zoom: 0.42` aplicado via React. O `html2canvas` capturava o elemento já redimensionado pelo zoom do container.

**Correção:** Quando o overlay de impressão não está aberto, clonamos o elemento `.ft-ficha`, removemos o contexto de zoom e renderizamos o clone off-screen em tamanho real (1040px):
```javascript
tempEl = source.cloneNode(true);
tempEl.style.cssText = [
  'position:fixed', 'top:-9999px', 'left:-9999px',
  'zoom:1', 'transform:none', 'width:1040px',
  'pointer-events:none',
].join(';');
document.body.appendChild(tempEl);
// html2canvas renderiza aqui, em tamanho real
```

**Arquivo:** `src/ficha-omie-publish.js` (v4 → v5) · Commits: `626a8ca`, `28e18d0`

> **Nota:** A primeira tentativa de correção usou `visibility: hidden` no clone, o que fez o `html2canvas` gerar uma página em branco. Removido na correção seguinte.

---

## Estado Final da Funcionalidade

### Fluxo completo (lado do cliente)
1. Usuário abre uma Ficha Técnica com `codigoProduto` preenchido
2. Clica em **"Publicar no Omie"** (botão azul — habilitado se e somente se `codigoProduto` está preenchido)
3. Toast: "Gerando PDF da ficha…"
   - Elemento `.ft-ficha` é clonado e renderizado em tamanho real (1040px, sem zoom)
   - `html2canvas` captura o DOM em alta resolução (scale: 2)
   - `jsPDF` converte para A4 (landscape ou portrait conforme orientação da ficha)
4. Toast: "Enviando para o Omie…"
   - `supabase.functions.invoke('publicar_ficha_omie', { body: {...} })`
5. Toast de sucesso: `✅ Ficha anexada ao produto VPXX-NNN no Omie (FICHA-TECNICA-VPXX-NNN.pdf)`

### Fluxo completo (Edge Function — Supabase)
1. Recebe `ficha_id` + `pdf_base64`
2. Busca `codigo_produto` na tabela `fichas_tecnicas`
3. **Valida produto** no Omie: `ConsultarProduto` → obtém `nId` interno
4. Comprime PDF em ZIP (`fflate.zipSync`)
5. Calcula MD5 da string base64 resultante
6. **Anexa arquivo**: `IncluirAnexo` com `cTabela: "produto"`, `cCodIntAnexo` (max 20 chars), `cArquivo` (ZIP em base64), `cMd5`
7. Registra evento em `vp_logs`

### Proteções implementadas
- **Anti-duplicidade:** Lock `busy` no cliente impede cliques duplos enquanto publicação está em andamento
- **REDUNDANT do Omie:** API do Omie bloqueia chamadas idênticas em menos de ~60s. Detectado via regex no `faultstring` e exibido com tempo de espera: `⏳ O Omie bloqueou chamadas repetidas — aguarde Xs e clique de novo.`
- **Ficha já anexada:** Detectado e informado ao usuário com `📎 Esta ficha já está anexada ao produto`

---

## Arquivos Modificados

| Arquivo | Versão | Mudança principal |
|---|---|---|
| `src/ficha-tecnica.jsx` | v15 | Botão Omie habilitado apenas com `codigoProduto` |
| `src/ficha-omie-publish.js` | v5 | Clone off-screen para PDF em tamanho real |
| `supabase/functions/publicar_ficha_omie/index.ts` | v13 | ZIP + MD5(base64) + cTabela singular + cCodIntAnexo ≤20 |
| `index.html` | — | Bumps de versão dos scripts acima |

---

## Commits desta sessão

```
28e18d0  fix(omie): remove visibility:hidden do clone — html2canvas ignorava o elemento
626a8ca  fix(omie): PDF gerado em tamanho real (clone fora do zoom do preview)
88d15fc  fix(omie): cMd5 calculado sobre a string base64 de cArquivo
06da463  fix(omie): MD5 calculado sobre bytes do ZIP
d2e10da  fix(omie): cTabela corrigido para "produto" (singular)
c719d46  fix(omie): PDF comprimido em ZIP + cMd5 obrigatório (spec IncluirAnexo)
efd1554  fix(omie): cCodIntAnexo truncado a 20 chars
f82b502  fix(omie): remove restrição podeGerar do botão Publicar
cd1659d  fix(omie): trata anti-duplicidade REDUNDANT + trava clique duplo
```

---

## Próxima Etapa Pendente

O último teste mostrou que o arquivo está chegando ao Omie, mas o PDF chegou em **branco** (causado pelo `visibility:hidden` que foi removido no commit `28e18d0`). A correção foi aplicada mas **ainda não foi testada** ao momento deste relatório.

**Ação necessária:** Após Ctrl+Shift+R no vpprd, publicar qualquer ficha com `codigoProduto` preenchido e verificar no Omie (aba Anexos do produto) se o PDF chegou com conteúdo correto.

Se o PDF ainda chegar em branco ou com conteúdo errado, a próxima hipótese de debug é que `cloneNode(true)` não preserva corretamente os `src` das imagens gerenciadas pelo React (via hook `useImgURL`). Nesse caso, a alternativa seria abrir o overlay de impressão programaticamente antes de capturar.

---

*Relatório gerado por Claude Sonnet 4.6 · Sessão de 12/06/2026*
