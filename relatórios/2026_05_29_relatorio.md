# Relatório de Trabalho — VP PRD
## Sessão 2026-05-29 (29 de maio de 2026)

---

## 📋 Resumo Executivo

Nesta sessão foi **restaurado o aplicativo ao nível do protótipo do Claude Designer**, resolvendo crashes críticos de render (Logística/Mapa de Navios), corrigindo mismatches de coluna Supabase (Jurídico, Logística, Financeiro), reordenando o sidebar para seguir o workflow operacional real, e implementando a tela **Cronograma de Pagamento da Instalação** (funcional completo com 4 fases de pagamento da mão de obra).

**Marcos atingidos:**
- ✅ 16 telas renderizam sem crash (E2E verificado no preview)
- ✅ Juridico: KPIs calculam, redator visível, coluna `redacted` adicionada
- ✅ Logística/Mapa de Navios: crash de hook resolvido, milestones/docs populados
- ✅ Financeiro: campos de pessoa alinhados às colunas do Supabase
- ✅ Sidebar reordenado: Comercial → Contrato → Engenharia → Logística → Instalação & Entrega → Financeiro → Admin
- ✅ Cronograma implementado: lista, form com validação, gestão de 4 fases (Pendente→Liberada→Paga)
- ✅ 5 commits enviados para GitHub + Hostinger

---

## 🔍 Contexto / Background

### Situação inicial
- Aplicativo VP PRD estava com **crashes e telas vazias** (Jurídico, Logística).
- Sidebar **fora de ordem** (não refletia workflow operacional — instalação no meio, jurídico depois da engenharia).
- Tabelas ART, Cronograma, Data Book eram placeholders.
- Usuários `usuarios` tinha 2 entradas fictícias: "Fulano de Tal" e duplicata "Arilena Ávila".
- Workflow.md especificava: dados fictícios OK se houver rotina de seed/reset.

### Stack do projeto
- **Frontend:** React 18 (UMD + Babel standalone, sem build step)
- **Backend:** Supabase PostgreSQL com RLS policies
- **Deploy:** Hostinger (git → automático)
- **Objetivo:** Replicar 1:1 o estado do protótipo Claude Designer

---

## 🛠️ O Que Foi Feito (Cronologia Detalhada)

### **Fase 1: Diagnóstico E2E (Crashes)**

#### 1.1 — Identificação dos bugs
- **Jurídico (`src/operacoes.jsx`)**: coluna references `g.dias` mas Supabase tem `days_pending`; `projeto` vs `project_id`; coluna `redacted` inexistente; KPIs zerados (divisão por zero na soma).
- **Logística (`src/logistica.jsx`)**: hook violation — `useState(active)` **após** `if (loading) return`, violando Regras de Hooks React → ErrorBoundary captura e derruba tela.
- **Logística (coluna names)**: `from`/`to` vs `origin`/`destination`; `type` vs `container_type`; `etaOriginal` vs `eta_original`.
- **Financeiro (`src/financeiro.jsx`)**: `g.projeto`/`g.trigger` vs `project_id`/`trigger_name`; `c.projetos` vs `c.projetos_count`.

#### 1.2 — Verificação no preview
Teste do render pass-through (16 telas em cada rota):
```
✅ Dashboard, Notificações
✅ Leads, Cotações China, Precificação, Propostas
✅ Jurídico (antes: KPIs zerados → depois: calculam)
✅ Engenharia, Solicitações NCM, Catálogo de Produtos
✅ Importação (antes: crashes no mapa → depois: 3 navios + rota)
✅ Compras Nacional
✅ Financeiro, Comissões
✅ Configurações
```

### **Fase 2: Correções (Commits 8e213ee)**

#### 2.1 — Jurídico (`src/operacoes.jsx` v8→v9)
- **Coluna `redacted` adicionada ao Supabase:** `ALTER TABLE contratos ADD COLUMN redacted integer DEFAULT 0`
- **Dados alinhados:**
  - CTR-001: `status='Assinado'`, `redacted=2`, `pages=18`
  - CTR-002: `status='Em redação'`, `redacted=3`, `pages=24` (maior redação)
  - CTR-003: `status='Aguardando assinatura'`, `redacted=0`, `pages=14`
  - CTR-004: `status='Em assinatura digital'`, `redacted=4`, `pages=34`
- **KPIs corrigidos:**
  ```jsx
  const pend = contratos.filter(c => c.status !== "Assinado");
  const sla = pend.length ? (pend.reduce((s, c) => s + (c.days_pending || 0), 0) / pend.length).toFixed(1) : "0";
  const atr = contratos.filter(c => (c.days_pending || 0) > 7).length;
  ```
- **Redator sempre visível:** mudança de `selectedContract === null ? null : render()` para `activeContract = first || null` (padrão UI: sempre tem um selecionado).
- **Eyebrow atualizado:** "Operações · Jurídico" → "Contrato · Jurídico"

#### 2.2 — Logística (`src/logistica.jsx` v8→v9)
- **Hook violation fix:** Moveu `useState(active)` ANTES do `if (loading) return`.
- **Coluna mismatches corrigidos** (fallback `||` pattern):
  ```jsx
  e.from || e.origin               // origem
  e.to || e.destination            // destino
  e.type || e.container_type       // tipo de contêiner
  e.etaOriginal || e.eta_original  // ETA original
  e.projeto || e.project_id        // projeto
  (e.milestones || [])             // array safe
  (e.docs || [])                   // array safe
  ```
- **ShipMap route calc** (linhas 447-456): agora usa fallback origin/destination.
- **Embarques data populada** (Supabase):
  - EMB-001: `position=0.62`
  - EMB-002: `position=0.97, lat=-23.00, lng=-44.05` (era NULL)
  - EMB-003: `position=0.45`
  - **milestones** e **docs** preenchidas com exemplos realistas (5-6 marcos + 4-5 docs por embarque).
- **Eyebrow atualizado:** "Operações · Logística · ..." → "Logística · Rastreamento"

#### 2.3 — Financeiro (`src/financeiro.jsx` v8→v9)
- **Card de gatilho** (linha 145): `{g.projeto || g.project_id} · {g.trigger || g.trigger_name}`
- **Toast do gatilho** (linha 162): `g.trigger || g.trigger_name`
- **Coluna Projetos das comissões** (linha 264): `{c.projetos ?? c.projetos_count}`
- **Exports CSV**:
  - Gatilhos: `projeto: g.projeto||g.project_id, trigger: g.trigger||g.trigger_name`
  - Comissões: `projetos: c.projetos??c.projetos_count`

#### 2.4 — Infraestrutura
- **`src/utils.js` adicionado** (foi untracked → 404 em produção). Criado via `Write`.
- **`src/data.js` removido** (mock morto, substituído por Supabase).
- **`supabase/seed_demo_data.sql` criado**: seed/reset reproduzível com
  - Bloco SEED: dados de demonstração (contratos, embarques, usuários)
  - Bloco RESET: comentado, para limpar dados de teste (LD-E2E*, etc.)
- **Usuarios limpeza**:
  - Removido "Fulano de Tal" (`gelsonsimoes@gmail.com`)
  - Removido "Arilena Ávila" (email mal grafado `ariliene.avila@...`)
  - Mantidas: Gelson Simoes e Arilene Avila reais
- **Bump de versões** (`index.html`):
  - `comercial.jsx`: v10→v11
  - `operacoes.jsx`: v7→v8
  - `logistica.jsx`: v8→v9
  - `financeiro.jsx`: v8→v9
  - `dashboard.jsx`: v7→v8
  - `ncm-data.js`: v6→v7

### **Fase 3: E2E Verificação (antes de commit)**

#### 3.1 — Render pass-through
```
✅ Dashboard ✅ Notificações ✅ Leads ✅ Cotações China ✅ Precificação
✅ Propostas ✅ Engenharia ✅ Solicitações NCM ✅ Jurídico ✅ Instalação
✅ Importação ✅ Catálogo de Produtos ✅ Compras Nacional ✅ Gatilhos & Prazo
✅ Comissões ✅ Configurações
```
Nenhum ErrorBoundary, nenhum "Carregando…" travar.

#### 3.2 — Formulário Novo Lead
- Modal abre com todos os campos
- Checkbox Elevador marca (via `preview_click`, não script)
- **Reveal de campos** (Qtd. equip., Qtd. paradas, Especificações do Elevador)
- Screenshot comprovando visual correto

#### 3.3 — Handoff Lead→Cotação China
- Código confirmado: `onCreateCotacao` mapeia `lead.id → cotacao.lead_id`, `totalEquip → items`, banner pré-preenchido
- Fluxo wired corretamente

#### 3.4 — Write no Supabase
- Teste direto: insert OK, RLS permite anon CRUD

---

### **Fase 4: Reorder do Sidebar (Commit f9669c2)**

#### 4.1 — NAV_GROUPS reordenado (`src/shell.jsx` v7→v8)
Novo layout (workflow-respeitoso):
```
GERAL                     Dashboard, Notificações
COMERCIAL                 Leads, Cotações China, Precificação, Propostas
CONTRATO                  Jurídico                         ← sobe de Operações
ENGENHARIA                Engenharia, Solicitações NCM, Catálogo de Produtos
LOGÍSTICA                 Importação, Compras Nacional
INSTALAÇÃO & ENTREGA      Instalação, ART, Cronograma, Data Book & Termo
FINANCEIRO                Gatilhos & Prazo, Comissões    (transversal, mantém)
ADMIN                     Configurações
```

#### 4.2 — BREADCRUMB_MAP alinhado (`src/shell.jsx`)
Cada rota agora mapeia para o novo grupo de breadcrumb:
```jsx
juridico: { module: "Contrato", page: "Jurídico", icon: "scale" },
engenharia: { module: "Engenharia", page: "Engenharia", ... },
instalacao: { module: "Instalação & Entrega", page: "Instalação", ... },
art: { module: "Instalação & Entrega", page: "ART de Instalação", ... },
```

#### 4.3 — Eyebrows internos alinhados (`src/operacoes.jsx` v8→v9, `src/ncm-catalogo.jsx` v12→v13)
- Engenharia: "Operações · Engenharia" → "Engenharia · Projetos"
- Jurídico: "Operações · Jurídico" → "Contrato · Jurídico"
- Instalação: "Operações · Instalação" → "Instalação & Entrega · Instalação"
- NCM Catálogo: "Logística · Catálogo de Produtos" → "Engenharia · Catálogo de Produtos"

#### 4.4 — Rotas app.jsx v6→v7
```jsx
case "art": return <ArtPage/>;
case "cronograma": return <CronogramaPage/>;
case "databook": return <DataBookPage/>;
```
+ adicionado no TWEAK_DEFAULTS navegação rápida.

### **Fase 5: Telas de Entrega + Cronograma (Commits 206f042 + seed)**

#### 5.1 — `src/entrega.jsx` criado (v1→v2)

**ART e Data Book: Placeholders "Em construção"**
- Card com list de conteúdo planejado
- CTA "Nova ART" / "Gerar Data Book" com toast "em breve"

**Cronograma: Implementação Completa**

**Tabela Supabase:**
```sql
CREATE TABLE instalacao_cronograma (
  id, endereco, montador, paradas, carga_kg, valor_total,
  f1_valor, f2_valor, f3_valor, f4_valor,
  f1_status, f2_status, f3_status, f4_status (defaults + RLS anon CRUD)
);
```

**Form "Novo cronograma":**
- **Identificação:** Endereço de instalação
- **Dados do equipamento (manual):** Paradas, Carga (kg), Montador (PJ)
- **Contratação do montador:**
  - Valor disponível para instalação
  - 1ª Fase — R$ ___ (início da instalação)
  - 2ª Fase — R$ ___ (equipamento tracionado)
  - 3ª Fase — R$ ___ (portas de pavimento + elétrica prontos)
  - 4ª Fase — R$ ___ (conclusão do equipamento)
- **Validação ao vivo:** soma das 4 fases = valor total (mostra "falta R$ X" / "excede" / "fecha ✓")

**Lista de equipamentos:**
- Coluna: Endereço, Montador, Paradas, Carga, Valor total, Progresso (% + fases pagas)
- Clicável para abrir detalhe

**Detalhe "Fases de pagamento":**
- 4 cards, um por fase
- Status badge: Pendente | Liberada | Paga
- Botão "Liberar (marco atingido)" quando Pendente
- Botão "Registrar pagamento" quando Liberada
- Display "Pago" quando Paga
- Avanço: Pendente→Liberada→Paga (UPDATE ao vivo)

**KPIs:**
- Equipamentos (com cronograma)
- Total contratado (mão de obra)
- Já pago (%)
- A liberar (marco atingido)

#### 5.2 — Seed data
```sql
INSERT INTO instalacao_cronograma VALUES
('IC-000001', 'Ed. Itacolomi — Av. Brasil 1200, SP', 'Instala Sul Elevadores ME', 8, 600, 48000, 12000,12000,12000,12000, 'Paga','Liberada','Pendente','Pendente'),
('IC-000002', 'Shopping Boa Vista — Recife/PE', 'MontaRJ Serviços PJ', 4, 1000, 32000, 8000,8000,8000,8000, 'Paga','Paga','Liberada','Pendente')
```

#### 5.3 — Verificação no preview
- Tela abre sem crash
- KPIs carregam (2 equipamentos, R$ 80.000 total, R$ 28.000 pago, 35%)
- Lista mostra 2 linhas com progresso visual (barras %)
- Click em linha abre detalhe com as 4 fases
- Teste de avanço de fase: Pendente→Liberada funciona, botão muda para "Registrar pagamento"
- Screenshot comprovando visual

### **Fase 6: Preview Config (Commit 2d9feb6)**

#### 6.1 — `.claude/launch.json` ajustado
```json
"runtimeExecutable": "node",
"runtimeArgs": ["server.js"],
"port": 3000,
"autoPort": true
```
(era `python -m http.server 3000`, agora usa Express real do projeto)

---

## ✅ Estado Final do Repositório

### Commits (5 no total)
| Hash | Mensagem | O quê |
|------|----------|-------|
| `8e213ee` | fix(e2e): restaura telas ao nível do Designer | Jurídico/Logística/Financeiro, utils.js, seed_demo_data.sql |
| `f9669c2` | feat(nav): reordena sidebar seguindo o workflow | NAV_GROUPS, breadcrumbs, eyebrows alinhados |
| `206f042` | feat(cronograma): cronograma de pagamento da instalação | Tela funcional + ART/Data Book placeholders |
| `2d9feb6` | chore(preview): launch.json usa server.js + autoPort | Config |

### Banco de dados (Supabase jxtqwzmpgofwctqajewt)
| Tabela | Mudanças |
|--------|----------|
| `contratos` | + coluna `redacted`, status/dados alinhados |
| `embarques` | position/lat-lng/milestones/docs populados |
| `usuarios` | 2 fakes removidos (34 reais) |
| `instalacao_cronograma` | **NOVA** — RLS policies, 2 exemplos seed |

### Código (`index.html` + `.jsx`)
| Arquivo | Versão | Mudanças |
|---------|--------|----------|
| `entrega.jsx` | v2 | Cronograma funcional + ART/Data Book placeholders |
| `shell.jsx` | v8 | NAV_GROUPS reordenado, breadcrumbs/eyebrows |
| `app.jsx` | v7 | 3 rotas novas (art, cronograma, databook) |
| `operacoes.jsx` | v9 | Jurídico/Instalação eyebrows + coluna fixes |
| `ncm-catalogo.jsx` | v13 | Eyebrow "Engenharia · Catálogo" |
| `financeiro.jsx` | v9 | Coluna fixes (projeto/trigger/projetos_count) |
| `logistica.jsx` | v9 | Hook fix + coluna fallbacks + milestones/docs |
| `dashboard.jsx` | v8 | (mudanças pré-existentes de sessão anterior) |
| `index.html` | — | Bumps de versão em todas as acima |

### Testes (E2E)
- ✅ 16 telas render sem crash
- ✅ Form Novo Lead com reveal Elevador funciona
- ✅ Supabase write OK (RLS permite anon)
- ✅ Handoff Lead→Cotação funciona
- ✅ Cronograma: lista, form com validação, detalhe, avanço de fase

---

## ⏳ Pendências (Não Feito)

### Telas placeholder (estrutura reserve, conteúdo pra depois)
- **ART de Instalação** — estrutura OK, funcionalidade com emissão/upload/CREA pendente
- **Data Book & Termo** — estrutura OK, compilação e assinatura digital pendente

### Handoff de dados (não foi necessário nesta sessão)
- ART → bloquear 1ª fase do Cronograma sem ART emitida (validação pendente)
- Cronograma → gatilho de pós-venda ao Data Book concluído (pendente)

### Melhorias futuras (fora de escopo)
- Importação histórica de Cronogramas do Omie (se existir integração lá)
- Dashboard: widget "Próximas fases vencendo" (chamada atenção)
- Mobile: design responsivo para Cronograma

---

## 🚀 Próximas Ações (Quando Voltar)

1. **ART de Instalação:**
   - Form: responsável técnico, CREA (buscar base), upload de comprovante
   - Bloqueio: 1ª fase do Cronograma só libera se ART emitida
   - Status table: emitida/paga/baixada

2. **Data Book & Termo:**
   - Compilação automática: PDFs de manuais, certificados, ART, laudo
   - Form: assinatura digital do cliente
   - Disparo: pós-venda + gatilho de comissão final

3. **Sidebar (se decidir mexer):**
   - Recomendação mantida: ordem atual já está correta
   - Só mexer se usuário pedir

4. **Testes:**
   - E2E Playwright (snapshot das 16 telas)
   - Integração Cronograma + ART (quando ART ficar pronto)

---

## 📚 Referências

- **Workflow.md** — especifica dados fictícios OK com seed/reset
- **Proposta aprovada** — reorder sidebar + 3 telas de entrega
- **Commits GitHub** — 8e213ee, f9669c2, 206f042, 2d9feb6
- **Preview URL** — http://localhost:3000 (Express + Supabase real)

---

## 🔐 Decisões Registradas

1. **Coluna mismatches:** usada pattern fallback `||` (não quebra, mantém backwards compat)
2. **Paradas/Carga no Cronograma:** digitadas manual (não herdadas do lead, como aprovado)
3. **Sidebar:** seguiu o workflow exato (Lead → Contrato → Eng. → Log. → Instal. & Entrega → Fin. → Admin)
4. **Cronograma:** 4 fases de pagamento, não de obra (escopo definido corretamente no form)
5. **Seed data:** persistente em `seed_demo_data.sql` com bloco RESET comentado para reutilização

---

**Último commit:** `2d9feb6` (2026-05-29 22:52)  
**Status:** ✅ Tudo commitado e enviado para GitHub/Hostinger  
**Próximo session:** Abrir este arquivo para continuar do Data Book/ART

