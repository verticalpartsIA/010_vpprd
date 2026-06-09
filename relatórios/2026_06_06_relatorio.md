# Relatório de Trabalho — VP PRD (vpprd)
## Sessão 2026-06-06 · Copiloto VP (a "bolinha") + Auditoria E2E

> Documento de portfólio/handoff. Quem retomar o projeto lê isto e sabe **exatamente** o que foi feito, onde está e o que falta.
> Autor: Claude Opus 4.8 · Repositório: `github.com/verticalpartsIA/vpprd` · Supabase: `jxtqwzmpgofwctqajewt`

---

## 0. TL;DR

1. **Entregue e em produção:** o "Copiloto VP" — assistente de IA global ("a bolinha") que acompanha o usuário em **todas as telas**, com 3 superpoderes: **conversar**, **preencher formulários** (perguntando o que não sabe) e **revisar documentos** apontando erros + sugestões. Commit `cb2cad5` na `main` (deploy automático Hostinger).
2. **IA = Anthropic Claude** (`claude-sonnet-4-6`) via Edge Function `vp-copiloto`. **Nunca foi Gemini** — corrigido qualquer mal-entendido.
3. **Auditoria E2E** rodada de ponta a ponta: **23/23 telas OK, 0 erros, 0 crashes**. Artefatos em `../testesE2E/`.
4. **Atenção de ambiente:** o repositório real é `C:\Users\gelso\Projetos_Sites\vpprd\vpprd_claudeDesigner\`. Existe um **clone redundante** `C:\Users\gelso\Projetos_Sites\vpprd_repo\` criado por engano — **pode apagar**.

---

## 1. Esclarecimento importante: IA é Anthropic, não Gemini

A bolinha e toda a IA do vpprd usam **Anthropic Claude**. Varredura feita no projeto inteiro (repo GitHub + Edge Functions + banco Supabase): **zero menção a "Gemini"**. A confusão veio de uma linha de uma planilha externa de credenciais (que cita Gemini para *outros* projetos) — não tocada, conforme instrução. **Para o vpprd: sempre Anthropic.**

- Edge Function `ncm-duimp-assist` (Copiloto NCM da Ficha Técnica): `ANTHROPIC_API_KEY` + `claude-sonnet-4-6`.
- Edge Function `vp-copiloto` (bolinha global, nova): idem.

---

## 2. Feature principal — Copiloto VP ("a bolinha")

### 2.1 O que é
Antes, o único assistente era o **Copiloto NCM/DUIMP** (`FtCopiloto`), restrito à tela de **Ficha Técnica**. Agora há uma **bolinha global** que aparece em **todas as telas** e faz três coisas:

| Modo | Gatilho na UI | Comportamento |
|------|---------------|---------------|
| **chat** | digitar no campo | Responde dúvidas sobre a tela/sistema. |
| **fill** | botão **✨ Preencher página** | Lê os campos da tela e preenche o que sabe; **pergunta** o que não tem como adivinhar (CNPJ, razão social, valor…). Continua preenchendo conforme o usuário responde. |
| **analyze** | botão **🔍 Revisar erros** | Lê o documento/preview e aponta erros + sugestões, com severidade (alta/média/baixa). |

**Princípio:** decide e ajuda de verdade, mas **nunca inventa** dado sensível — pergunta.

### 2.2 Arquitetura (mecanismo universal por DOM)
Funciona em **qualquer tela atual ou futura, sem fiação por página**:
- **Leitura** (`vpcScanPage`): varre `main.main` por `input/textarea/select` visíveis, resolve o rótulo por estrutura (`label[for]` → `aria-label` → `<label>` ancestral → `placeholder`), monta `{idx,label,type,value,required,options}`.
- **Preenchimento** (`vpcApplyFills` + `vpcSetValue`): inputs são controlados pelo React; usa **setter nativo do prototype + disparo de `input`/`change`** para o React captar. Selects casam por value/texto. Campo preenchido pisca amarelo (`.vpc-flash`).
- **Revisão**: envia também `documentText` = `innerText` do `main` (até 12k chars).

### 2.3 Arquivos (commit `cb2cad5`)
| Arquivo | Papel |
|---------|-------|
| `src/vp-copiloto.jsx` | **novo** — bolinha + painel de chat + scanner + preenchedor (cliente React UMD). |
| `styles/vp-copiloto.css` | **novo** — estilo tema VP (amarelo/preto), prefixo `vpc-`. |
| `supabase/functions/vp-copiloto/index.ts` | **novo** — Edge Function (IA Anthropic), registro no repo. |
| `instructions.md` | **novo** — persona, contrato da API, mecanismo, como estender. |
| `src/app.jsx` | montagem `<VpCopiloto route role>` em todas as rotas, **exceto** `ficha-tecnica`. |
| `index.html` | carrega `styles/vp-copiloto.css?v=1` + `src/vp-copiloto.jsx?v=1`; bumped `app.jsx?v=17→v=18` (cache-bust). |

> **Decisão de UX:** na **Ficha Técnica** a bolinha global fica **oculta** — o especialista de NCM/DUIMP (`FtCopiloto`, `src/ficha-tecnica-copiloto.jsx`) já é dono daquela tela. Evita dois robôs. Podem ser unificados no futuro.

### 2.4 Edge Function `vp-copiloto` (Supabase, ACTIVE, v2)
- `POST https://jxtqwzmpgofwctqajewt.supabase.co/functions/v1/vp-copiloto` (Bearer = anon key, `verify_jwt: true`).
- Modelo `claude-sonnet-4-6`, `max_tokens: 4096`, `temperature: 0.2`. Secret `ANTHROPIC_API_KEY` (compartilhado com `ncm-duimp-assist`).
- **Request:** `{ mode, message, history[], page:{route,title,fields[]}, documentText? }`.
- **Response:** `{ reply, fills[], questions[], issues[] }` (só as chaves relevantes ao modo; `reply` sempre).
- **Bug corrigido nesta sessão (v1→v2):** na revisão de documentos grandes (Proposta, 74 campos) o JSON estourava `max_tokens:2000` e voltava truncado → HTTP 500 "Resposta da IA ilegível". Fix: `max_tokens` 2000→**4096** + instrução de limitar a ~10 achados mais relevantes. Revalidado: Proposta retorna 10 issues, JSON íntegro.

### 2.5 Verificações end-to-end (no preview, não só código)
- **Chat:** respondeu sobre a tela de Leads. ✅
- **Preencher (Contrato Venda):** preencheu Razão Social + Telefone; **perguntou** CNPJ/representante/endereço/CPF/e-mail sem inventar; ao responder, completou os **8 campos**. ✅
- **Revisar (Contrato Venda):** achou **7 problemas**, incluindo um **CPF inválido** plantado de propósito. ✅
- **Revisar (Proposta):** achou **10 problemas** com o mesmo rigor dos contratos (valor total vazio, inconsistência de moeda R$ × US$, validade sem data-base, garantia ambígua, Incoterm incompleto…). ✅

---

## 3. Auditoria E2E — execução completa (read-only)

Rodado a partir de `../testesE2E/` (specs SPEC/SDD/HARNESS). Ambiente: preview local servindo este mesmo código.

| Métrica | Resultado |
|---|---|
| Páginas auditadas | **23 / 23** |
| Páginas OK / Atenção / Erro | **23 / 0 / 0** |
| Error Boundary disparado | **0** |
| Erros de console / runtime | **0** |
| Interações seguras (abas/filtros) | **52 — 100% OK** |
| Ações mutacionais | **59 identificadas e bloqueadas** (nada criado/enviado/aprovado/excluído) |
| Botões / campos inventariados | 402 / 19 |
| Screenshots | **23/23** gravados |

**Único alerta (baixo):** build roda React **development** + Babel **standalone** no browser (warning de performance). Nenhum bug funcional.

**Artefatos** (em `C:\Users\gelso\Projetos_Sites\vpprd\testesE2E\`, fora do repo):
- `reports/consolidated-report.md` + `reports/pages/*.md` (23) + `reports/safe-interactions-report.md`
- `reports/logs/*.json` (console, network, api, safe) + `reports/maps/*.json` (sidebar, routes, buttons, fields)
- `screenshots/2026-06-06T05-52-39-000Z/*.jpg` (23). A run anterior (05/06) foi preservada.

---

## 4. Estado do Git e Deploy

- **Branch:** `main`. **Commit desta sessão:** `cb2cad5` — *feat(copiloto): bolinha global (Copiloto VP)* — 6 arquivos, +676/−1.
- **Push feito** para `github.com/verticalpartsIA/vpprd` → **deploy automático Hostinger** (produção `vpprd.vpsistema.com`).
- **Supabase Edge Functions:** `vp-copiloto` (v2, ACTIVE), `ncm-duimp-assist` (v8), `ais-sync` (v6).
- Untracked locais (não versionados, ok): `docs/`, `uploads/`, `relatórios/2026_05_29_relatorio.md`.

---

## 5. Pendências / próximos passos

1. **Apagar o clone redundante** `C:\Users\gelso\Projetos_Sites\vpprd_repo\` (criado por engano no início da sessão; o repo real é `vpprd_claudeDesigner`). *Aguardando autorização do Gelson.*
2. **Performance (opcional):** trocar React development→production e pré-compilar JSX (sair do Babel standalone). Reduz ~5 MB de download e ~1–3 s de compilação no browser. Edições já prototipadas no clone abandonado; não aplicadas ao repo real para manter o escopo cirúrgico.
3. **Unificar copilotos (futuro):** fundir o NCM especialista (`FtCopiloto`) dentro da bolinha global para haver um único assistente também na Ficha Técnica.
4. **Testabilidade:** adicionar `data-testid` em sidebar/abas/filtros e `aria-label` em botões de ícone (facilita E2E e acessibilidade).
5. **Ações novas da bolinha (futuro):** estender o contrato de resposta com ações (navegar, salvar) tratadas em `send()` no cliente.

---

## 6. Referências rápidas

- **Repo real (trabalhar aqui):** `C:\Users\gelso\Projetos_Sites\vpprd\vpprd_claudeDesigner\`
- **Persona/contrato da bolinha:** `instructions.md` (raiz do repo).
- **Edge Function da bolinha:** `supabase/functions/vp-copiloto/index.ts` (modelo/persona ficam aqui).
- **Supabase projeto:** `jxtqwzmpgofwctqajewt` · Secret `ANTHROPIC_API_KEY`.
- **Specs do teste E2E:** `../testesE2E/SPEC|SDD|HARNESS_mapa_telas_prd.md`.

---

*Relatório gerado em 06/06/2026 por Claude Opus 4.8. Contratos de Venda e Instalador são o padrão correto; Propostas e demais documentos seguem as mesmas regras (validado pela revisão da bolinha).*
