# CONTEXTO — Workflow por Setores (Comercial→Eng→Financeiro→Importação) + Integração vp-click

> **Status: FASE 1 IMPLEMENTADA, TESTADA E2E E COMMITADA (2026-06-10).**
> Próximo passo: FASE 2 (integração vp-click — seção 5). O usuário ainda vai criar
> os grupos de departamento no vp-click antes da Fase 2.
>
> Fase 1 entregue: migration `ficha_workflow_setores_e_historico` aplicada;
> `src/ficha-workflow-engine.js` (máquina de estados, window.FWF);
> `src/ficha-workflow-store.js` (transições+histórico+alertas, window.FWFStore);
> `src/ficha-workflow.jsx` (FwIconBar 5 ícones + Publicar, FwWorkflowCard stepper,
> FwTimelineModal, FwRevisaoModal, FwLeadModal); `styles/ficha-workflow.css`;
> integrado em `ncm-catalogo.jsx` (v18) e `ficha-tecnica.jsx` (v10 — deep-link
> `sessionStorage vpprd_ft_open` p/ o lápis + log criou/editou no save).
> Fichas pré-existentes foram backfilled p/ etapa `importacao`.

---

## 0. Onde estamos
- Mapa de entendimento **aprovado pelo usuário**.
- **Decisões fechadas** (via AskUserQuestion):
  1. **Granularidade vp-click** → **1 tarefa por ficha**, que muda de mão (status + responsável mudam a cada etapa). Idempotente — espelha o Hub atual, não duplica.
  2. **Grupos/departamentos** → **vp-click ganha grupos de verdade** (entidade atribuível; a tarefa aponta para o grupo). É mudança maior no vp-click — fica para a Fase 2.
  3. **Escopo** → **Fase 1 só no vpprd** (workflow + 5 ícones + histórico). **Fase 2** liga no Hub do vp-click.
- Próximo passo quando voltar: **detalhar e implementar a Fase 1**. Nada de código foi escrito ainda para esta tarefa.

---

## 1. Repositórios e ambientes (FATOS confirmados)

### vpprd (este projeto)
- Repo real: `C:\Users\gelso\Projetos_Sites\vpprd\vpprd_claudeDesigner\`
- GitHub: `https://github.com/verticalpartsIA/vpprd.git` (branch `main` = auto-deploy Hostinger ~2min → `vpprd.vpsistema.com`)
- Stack: React 18 UMD + Babel standalone (SEM build), Express 4 (`server.js`), Supabase.
- **Supabase vpprd**: project ref `jxtqwzmpgofwctqajewt` (`https://jxtqwzmpgofwctqajewt.supabase.co`)
- IA: **Anthropic Claude** `claude-sonnet-4-6` (NUNCA foi Gemini — zero Gemini neste projeto).
- SSO Guard: em preview, `sessionStorage.setItem('vpprd_sso_ok','1')` antes de cada reload.
- Cache-busting: todo script usa `?v=N` no index.html — bumpar ao editar.

### vp-click (separado)
- Repo canônico local: `C:\Users\gelso\Projetos_Sites\09_VP_CLICK\`
- GitHub: `https://github.com/verticalpartsIA/vp-click.git`
- Stack: Vite + Bun + Supabase. Hierarquia: **Workspace → Space → Folder → List → Task**.
- **Supabase vp-click**: project ref `sfpnjwllcmentoocylow` (PROJETO DIFERENTE do vpprd → integração é cross-project via Edge Function/webhook, NÃO acesso direto ao DB).

---

## 2. O fluxo de negócio (resumo)
Pré-venda de item importado sob demanda. Ficha técnica é **interna** (nunca vai ao cliente — protege fornecedor/custos), é a base do vendedor, e vira Catálogo de Produtos (DUIMP).

```
① COMERCIAL    Cliente liga → vendedor cria ficha com o básico (nome+WhatsApp do cliente + o que entende do item)
                  │ "Enviar p/ Engenharia"
② ENGENHARIA   Completa ficha + desenho técnico (se preciso)
                  │ "Devolver ao Comercial"
③ COMERCIAL    Confere e "Solicita custo"
                  │ "Enviar p/ Financeiro"
④ FINANCEIRO   Levanta custos + markup → preço de venda
                  │ "Devolver ao Comercial"
⑤ COMERCIAL    Faz proposta simples (Omie) e envia ao cliente
                  │ aguarda
⑥ CLIENTE      Aceita
                  │ "Enviar p/ Importação"
⑦ IMPORTAÇÃO   Flega o produto → RFQ ao fornecedor   ✅ JÁ EXISTE (portal de cotação /cotacao/:token)
                  │
⑧ PUBLICAR     Cadastro no Omie via API + Catálogo DUIMP
```
Regras: **status por SETOR** (Comercial · Engenharia · Financeiro · Importação), **"quem delega é sempre o anterior"** (cada etapa tem botão "concluir e enviar p/ próximo").

---

## 3. Onde isto vive na UI
- **Catálogo de Produtos** → clicar num produto abre, à direita, a **ficha do produto** (painel). É aí que ficam os 5 ícones + Publicar.
- Imagem de referência mostrou o painel com: ✏️ lápis, 🗄️ arquivar, 🗑️ lixeira, 🏷️ carimbinho, 👁️ olhinho, e botão **Publicar**.
- Adicionar uma **barra de etapas (stepper)** na ficha do produto: onde parou, quem já fez, de quem é a vez.

### Os 5 ícones (decisão)
| Ícone | Função |
|---|---|
| ✏️ Lápis | Editar → abre o editor da ficha técnica |
| 🗄️ Arquivar | Soft-hide do catálogo ativo, reversível, mantém histórico (MANTER — leve) |
| 🗑️ Lixeira | Excluir definitivo, com confirmação |
| 🏷️ Carimbinho | **Solicitar revisão** da ficha/produto → muda status + registra quem pediu (+ tarefa vp-click na Fase 2) |
| 👁️ Olhinho | **Histórico/log** (autor, data/hora, setor, ação, mudanças de etapa) — append-only |
| 🟣 Publicar | Cadastro no Omie (API de cadastros) — integração à parte |

---

## 4. FASE 1 — escopo a implementar (só vpprd)

### 4.1 Máquina de estados (na ficha técnica)
Gravar o workflow na ficha técnica (é onde nasce; o produto do catálogo é derivado).
- Colunas novas em `fichas_tecnicas` (verificar nomes reais da tabela antes): `etapa text`, `setor_responsavel text`, talvez `cliente_lead jsonb` (nome+whatsapp coletados pelo vendedor).
- Etapas: `comercial_rascunho → engenharia → comercial_custo → financeiro → comercial_proposta → cliente_analise → aprovado → importacao → publicado`.
- Cada transição é atômica: (a) muda status, (b) grava histórico, (c) [Fase 2] sincroniza vp-click.

### 4.2 Histórico (olhinho)
- Tabela nova `fichas_historico` (append-only):
  `id · ficha_id · ator_id · ator_nome · ator_setor · acao · de_etapa · para_etapa · detalhe(jsonb) · criado_em`
- Olhinho abre uma **timeline** legível.

### 4.3 UI
- Stepper de etapas + botões de handoff ("Enviar p/ Engenharia", "Devolver ao Comercial", "Solicitar custo", "Enviar p/ Importação", etc.) conforme a etapa atual e o papel/role.
- Os 5 ícones funcionais (arquivar = soft, lixeira = hard, carimbinho = solicitar revisão, olhinho = timeline, lápis = editor).
- Coleta básica do Comercial: nome + WhatsApp do cliente na criação da ficha.

### 4.4 Arquivos prováveis a tocar (confirmar ao voltar)
- `src/ficha-tecnica.jsx`, `src/ficha-tecnica-store.js`, `src/ficha-tecnica-engine.js`
- `src/ncm-catalogo.jsx` (painel da ficha do produto no Catálogo + ícones + stepper)
- Possível CSS novo `styles/ficha-workflow.css`
- Migration Supabase vpprd: colunas em `fichas_tecnicas` + tabela `fichas_historico` (+ RLS)
- index.html: bumpar versões dos scripts/css editados

---

## 5. FASE 2 — integração vp-click (NÃO agora, mas já mapeada)

### 5.1 O Hub já existe — ESTENDER, não recriar
- Edge Function `handle-integration-event` em `09_VP_CLICK/supabase/functions/handle-integration-event/index.ts` (deploy no ref `sfpnjwllcmentoocylow`).
- Autenticação: header `x-integration-secret` (secret atual no código: `vp-hub-integration-2026-secret`, via `INTEGRATION_SECRET`).
- Body: `{ source, event ('INSERT'|'UPDATE'), record, vendedor_nome, vendedor_email, cliente_nome, ... }`.
- Mapas internos: `LIST_IDS[source]→list_id`, `STATUS_MAP[source]`, `FOLLOWERS[source]`.
- **Idempotência**: tabela `vpclick_integration_links` (`source_project, source_table, source_record_id, vpclick_task_id, vpclick_list_id`). Se já existe → UPDATE da tarefa; senão → INSERT.
- Tabelas vp-click relevantes: `tasks` (title, description, status, priority, main_assignee_id, secondary_assignee_ids[], list_id, created_by), `profiles` (id, email), `vpclick_integration_links`.
- Usuário "Automação": `AUTOMACAO_USER_ID = fe56a4d8-e31d-4fbd-9d96-3b32cbd2a5d7`.

### 5.2 O que fazer na Fase 2
1. **vp-click**: criar a pasta (Folder) **"Cotação Importação | PRD"** com uma List (statusGroup = nossas etapas). Pegar o `list_id`.
2. **vp-click — grupos de verdade**: implementar conceito de grupo/equipe atribuível (decisão #2). O usuário VAI CRIAR os grupos de departamento lá (Comercial, Engenharia, Financeiro, Importação). Quando um grupo é citado na tarefa, o coletivo é responsável.
3. **Hub**: adicionar `source: 'prd'` → `LIST_IDS['prd']`, `STATUS_MAP['prd']` (8 etapas → labels), `buildTitle` caso `prd` (ex.: `[PRD · Eng] {produto} — cliente {x} → {setor da vez}`), e atribuir ao **grupo do setor da vez**.
4. **vpprd**: a cada transição de etapa, um **Edge Function leve no vpprd** (server-side, p/ não expor o secret) posta no Hub com `source:'prd'`, `record` = ficha (id, etapa, etc.), idempotente por `source_record_id = ficha_id`.
5. **1 tarefa por ficha** (decisão #1): a mesma tarefa é atualizada a cada handoff (status + grupo responsável mudam).

---

## 6. Estado do projeto vpprd ANTES desta tarefa (já no ar)
Último trabalho ENTREGUE e com PUSH em `main` (commits `fa8e5ac` + `2284824`):
- **Pedido a Fornecedor (RFQ)** bilíngue PT|EN + **Portal de Cotação** público `/cotacao/:token` (fornecedor preenche preços, vpprd recebe automático). Tudo testado E2E.
- Ficha Técnica: removido "Madeira"; categoria "Compatível com Fabricante" (11 fabricantes) vive na biblioteca (DB).
- Migration `pedidos_fornecedor_supplier_portal` aplicada no Supabase vpprd.
- Esta tarefa NOVA (workflow por setores) é independente e ainda não começou.

### Pendência de segurança (avisar o usuário de novo)
- O **token GitHub (PAT)** está embutido na URL do `origin` em ambos repos. Recomendado revogar e recriar, reconfigurar com `git remote set-url`. Ação do usuário.

---

## 7. Como retomar (checklist de arranque)
1. Ler este arquivo.
2. Confirmar estrutura real da tabela `fichas_tecnicas` no Supabase vpprd (colunas atuais) antes de migrar.
3. Implementar **Fase 1** (máquina de estados + histórico + 5 ícones + stepper), só vpprd.
4. Testar no preview (porta 3000; lembrar do SSO bypass).
5. Só depois, com OK do usuário, partir para a **Fase 2** (vp-click).
6. Não commitar/push sem o usuário pedir (push = deploy produção).
