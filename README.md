# VP PRD — Plataforma de Cotação de Importação · VerticalParts

> Sistema interno exclusivo para gestão do processo de importação de produtos da VerticalParts.
> Acesso obrigatório via portal **vpsistema.com** (SSO). Não é público.

🌐 **Produção:** [https://vpprd.vpsistema.com](https://vpprd.vpsistema.com)
📦 **Supabase:** `jxtqwzmpgofwctqajewt`
🚀 **Deploy:** Hostinger Node.js · branch `main`
🔐 **Entrada:** card "Cotação Importação | PRD" no vpsistema.com

---

## Stack

| Camada     | Tecnologia                                              |
|------------|---------------------------------------------------------|
| Frontend   | React 18 UMD + Babel Standalone (sem build step)        |
| Estilo     | CSS custom properties (`var(--vp-*)`) + classes utilitárias |
| Banco      | Supabase (PostgreSQL) — projeto `jxtqwzmpgofwctqajewt` |
| Servidor   | Express 4 (`server.js`) · serve arquivos estáticos      |
| Deploy     | Hostinger Node.js 18.x · auto-deploy via push na `main` |

---

## Perfis de Usuário

| Perfil       | Acesso                                                              |
|--------------|---------------------------------------------------------------------|
| `comercial`  | Dashboard, Leads, Cotações China, Propostas, Notificações          |
| `engenharia` | Dashboard, Engenharia, NCM, Jurídico, Instalação, Notificações     |
| `financeiro` | Dashboard + Precificação, Gatilhos & Prazo, Comissões              |
| `admin`      | Tudo — todos os módulos + Configurações                            |

> Itens marcados com 🔒 são restritos ao perfil indicado.

---

## Árvore completa do site — tela a tela

```
vpprd.vpsistema.com
│
├── ═══════════════════════════════════════════════════════
│   SHELL — presente em TODAS as telas
│   ═══════════════════════════════════════════════════════
│
├── SIDEBAR (esquerda)
│   ├── Logo VerticalParts + versão v2.4
│   ├── Botão [ ‹ ] colapsar / [ › ] expandir sidebar
│   │
│   ├── ── GERAL ──────────────────────────────────────────
│   │   ├── 🏠 Dashboard
│   │   └── 🔔 Notificações
│   │
│   ├── ── COMERCIAL ──────────────────────────────────────
│   │   ├── 🚩 Leads
│   │   ├── 🌐 Cotações China
│   │   ├── 🧮 Precificação              🔒 financeiro · admin
│   │   └── 📄 Propostas
│   │
│   ├── ── OPERAÇÕES ──────────────────────────────────────
│   │   ├── 📐 Engenharia
│   │   ├── 📦 Solicitações NCM
│   │   ├── ⚖️  Jurídico
│   │   └── 🪖 Instalação
│   │
│   ├── ── LOGÍSTICA ──────────────────────────────────────
│   │   ├── 🚢 Importação
│   │   ├── 🔍 Catálogo de Produtos
│   │   └── 🚛 Compras Nacional
│   │
│   ├── ── FINANCEIRO ─────────────────────────────────────
│   │   ├── ⏱️  Gatilhos & Prazo         🔒 financeiro · admin
│   │   └── 🏆 Comissões                🔒 financeiro · admin
│   │
│   └── ── ADMIN ──────────────────────────────────────────
│       └── ⚙️  Configurações            🔒 admin
│
├── HEADER (topo)
│   ├── Breadcrumb  →  vp-gestao / [Módulo] / [Página atual]
│   ├── 🔍 Barra de busca global  (desabilitada · "EM BREVE")
│   ├── Role switcher:  [Comercial] [Engenharia] [Financeiro] [Admin]
│   ├── 🔔 Ícone notificações  →  vai para tela Notificações
│   └── ❓ Ícone ajuda  →  toast "Central de ajuda em breve"
│
│
├── ═══════════════════════════════════════════════════════
│   TELAS PRINCIPAIS
│   ═══════════════════════════════════════════════════════
│
│
├── 🏠 DASHBOARD
│   │   Dados: Supabase (11 tabelas em paralelo) · KPIs por perfil ativo
│   │
│   ├── KPIs (4 cards — mudam conforme perfil selecionado)
│   │   ├── Perfil Comercial:
│   │   │   ├── Leads do mês
│   │   │   ├── Cotações em China
│   │   │   ├── Propostas enviadas
│   │   │   └── Conversão Lead → Proposta (%)
│   │   ├── Perfil Engenharia:
│   │   │   ├── Projetos abertos
│   │   │   ├── NCM pendentes
│   │   │   ├── NCM em análise
│   │   │   └── Alertas de engenharia
│   │   ├── Perfil Financeiro:
│   │   │   ├── A receber (contratos abertos)
│   │   │   ├── Comissões pendentes
│   │   │   ├── Gatilhos próximos 7 dias
│   │   │   └── Contratos abertos
│   │   └── Perfil Admin:
│   │       ├── Projetos ativos
│   │       ├── Embarques em trânsito
│   │       ├── Alertas críticos
│   │       └── Faturamento total
│   │
│   ├── Funil Pipeline  (gráfico de barras)
│   │   └── Estágios: Leads → Cotação China → Precificação → Proposta → Contrato
│   │
│   ├── Conversão por Origem  (barras horizontais com % de conversão)
│   │
│   ├── Gantt de Projetos  (linha do tempo)
│   │   └── Fases: Projeto → Fabricação → Importação → Instalação → Entrega
│   │
│   ├── Estoque Crítico  (tabela SKUs abaixo do mínimo)
│   │   └── Colunas: SKU · Nome · Qtd atual · Mínimo · Status (danger/warning)
│   │
│   ├── Central de Alertas  (cards — tabela alertas, resolved=false)
│   │
│   └── Minhas Tarefas  (lista · filtradas por role do perfil ativo)
│
│
├── 🚩 LEADS — Pipeline de Leads
│   │   Dados: tabela `leads` · ordenado por data desc
│   │
│   ├── KPIs: Leads ativos · Em qualificação · Propostas no ar · Valor pipeline
│   │
│   ├── Filtro de status (segmentos clicáveis):
│   │   Todos · Em qualificação · Aguardando cotação · Proposta enviada ·
│   │   Negociação · Convertido · Sem retorno
│   │
│   ├── Filtro por responsável  (select dropdown)
│   ├── Busca  (prédio · contato · equipamento)
│   ├── Paginação  (em breve)
│   │
│   ├── Tabela:
│   │   ID · Lead/Prédio · Contato · Equipamento · Origem · Status ·
│   │   Responsável · Valor · Próxima Ação · [→ detalhe]
│   │
│   └── Botões de ação:
│       ├── [Exportar]  →  toast "em breve"
│       ├── [Filtros avançados]  →  toast "em breve"
│       └── [Novo Lead]  →  toast "em breve"
│
│   └── 📋 LEAD DETAIL  (abre ao clicar em qualquer linha da tabela)
│       │
│       ├── [‹ Voltar para Leads]
│       ├── Header: ID · Origem · Prédio · Equipamento · Status badge · Prioridade badge
│       ├── Botões: [WhatsApp] [Email] [Precificar →]
│       │   └── "Precificar" navega direto para /precificacao
│       │
│       ├── Card "Resumo da oportunidade"
│       │   ├── Valor estimado · Marca do equipamento · Quantidade
│       │   ├── Ano construção · Tipo de serviço · Prazo desejado
│       │   └── Descrição enviada pelo cliente (texto livre)
│       │
│       ├── Card "Histórico de Atividades"  (timeline cronológica)
│       │   └── Entradas: criação · contato · cotação · visita · follow-up
│       │
│       ├── Card "Próximos passos sugeridos"  (orquestração automática)
│       │   └── Passos com estado:  current (preto) · next · future (cinza)
│       │       Ex: Aguardar cotação China → Visita técnica → Precificar → Proposta
│       │
│       ├── Card "Contato"
│       │   ├── Nome · cargo · telefone · e-mail
│       │   └── Botões: [WhatsApp] [Email]
│       │
│       ├── Card "Atribuição"
│       │   └── Vendedor · Equipe · Origem · Comissão prevista (4%)
│       │
│       └── Card "Etiquetas"  (badges livres)
│
│
├── 🌐 COTAÇÕES CHINA
│   │   Dados: tabela `cotacoes` · ordenado por data desc
│   │
│   ├── KPIs: Em aberto · Recebidas · SLA médio · Variação preço
│   │
│   ├── Filtro de status: Todos · Aguardando China · Recebida · Em análise · Aprovada
│   ├── Filtros: [Fornecedor] [Origem]
│   │
│   ├── Tabela:
│   │   ID · Prédio/Projeto · Fornecedor · Itens · Prazo · Status ·
│   │   Link público (token) · Total USD · [→ detalhe]
│   │
│   └── Botões: [Link público] [Nova Cotação]
│
│   └── 📋 COTAÇÃO DETAIL  (abre ao clicar em qualquer linha)
│       │
│       ├── [‹ Voltar para Cotações]
│       ├── Header: ID · Fornecedor · Prédio · Status · Prazo · Data solicitação
│       ├── Botões: [PDF] [Copiar link público] [Aprovar]
│       │
│       ├── Banner de link público
│       │   └── https://vp.cn/cotacao/{token} · sem autenticação · expira 7 dias
│       │       [Copiar link]
│       │
│       ├── Card "Itens solicitados"  (tabela)
│       │   ├── Colunas: SKU · Descrição · Categoria · Qtd · Preço unit. · Total
│       │   ├── Footer: Total FOB Shanghai
│       │   └── [+ Adicionar item]
│       │
│       ├── Card "Status China"  (timeline)
│       │   └── Etapas: Solicitação enviada → Recebido pelo fornecedor →
│       │               Aguardando preenchimento → Aprovação interna
│       │
│       └── Card "Fornecedor"
│           └── Nome · localidade · contato · WeChat · histórico de pontualidade
│
│
├── 🧮 PRECIFICAÇÃO  🔒 financeiro · admin
│   │   Dados: tabela `leads` (status = Convertido)
│   │
│   ├── KPIs: Margem média % · Cálculos abertos · Versões geradas
│   │
│   ├── Tabela de projetos:
│   │   Projeto · Cliente · Versões · Valor final · Margem % · Status
│   │
│   ├── Botões: [Exportar planilhas] [Nova precificação]
│   │
│   └── Painel de cálculo  (abre ao clicar no projeto ou em "Nova precificação")
│       ├── Calculadora: FOB China + II + IPI + PIS/COFINS + frete + margem → preço final
│       └── Histórico de versões do cálculo
│
│
├── 📄 PROPOSTAS
│   │
│   ├── Lista de propostas com status
│   └── [Nova Proposta]  →  abre wizard
│
│   ├── ✏️  PROPOSTA EDITOR  (wizard 3 etapas)
│   │   ├── Etapa 1: dados do cliente / projeto
│   │   ├── Etapa 2: itens e valores
│   │   ├── Etapa 3: condições e aprovação
│   │   ├── Preview em tempo real
│   │   └── [Gerar PDF] [Enviar por email]
│   │
│   └── 👁️  PROPOSTA PREVIEW  (visualização do PDF)
│
│
├── 📐 ENGENHARIA — Projetos de Engenharia
│   │   Dados: tabela `projetos`
│   │
│   ├── KPIs: Projetos ativos · Aguard. laudo · Visitas semana · SLA laudo
│   ├── Botões: [Calendário visitas] [Novo projeto]
│   │
│   ├── Coluna esquerda — lista de projetos:
│   │   └── Card por projeto:
│   │       ├── ID · Prédio · Status badge
│   │       ├── Visita técnica · Responsável · Arquivos
│   │       └── Pendência · Badge laudo (Aprovado/Reprovado/Pendente/Em análise)
│   │
│   └── Coluna direita — detalhe do projeto selecionado:
│       ├── [Anexar] [Aprovar Laudo]
│       └── Abas internas:
│           ├── 📄 Laudo Técnico
│           ├── 📦 Documentos
│           ├── 📋 BOM  (Bill of Materials)
│           ├── 📅 Visita
│           └── 🔢 NCM / Ficha Técnica
│               └── (módulo NCM embutido — mesmo componente do /ncm-kanban)
│
│
├── 📦 SOLICITAÇÕES NCM  (Kanban)
│   │   Dados: tabela `ncm_solicitacoes`
│   │
│   ├── Colunas Kanban:
│   │   ├── Não iniciado
│   │   ├── Em preenchimento
│   │   ├── Aguard. jurídico
│   │   ├── Aprovado
│   │   └── Cadastrado Siscomex
│   │
│   └── Clique em qualquer card  →  NCM DETAIL
│
│   └── 📋 NCM DETAIL  (abre ao clicar no card do kanban)
│       │
│       ├── Stepper visual  (5 etapas com descrição da etapa atual)
│       │   Não iniciado → Em preenchimento → Aguard. jurídico → Aprovado → Cadastrado
│       │
│       ├── Alerta verde  (se status = CADASTRADO: código Siscomex · versão · situação ATIVO)
│       │
│       ├── Bloco 1 — Identificação para Receita Federal
│       │   └── NCM selecionado · descrição oficial
│       │
│       ├── Bloco 2 — Denominação técnica
│       │   └── Campo texto · máx. 150 chars · contador em tempo real
│       │
│       ├── Bloco 3 — Detalhamento
│       │   └── Campo texto · máx. 500 chars · contador em tempo real
│       │
│       ├── Bloco 4 — Atributos dinâmicos
│       │   └── Campos gerados automaticamente conforme o NCM selecionado
│       │       (ex: material, espessura, comprimento, voltagem...)
│       │
│       ├── Bloco 5 — Status Siscomex
│       │   └── Código · Versão · Situação · Cadastrado por · Data
│       │
│       └── [Enviar para LogComex]  →  Modal de confirmação LogComex
│           └── Modal: resumo do produto · confirmação · [Cadastrar no Siscomex]
│
│
├── ⚖️  JURÍDICO — Contratos & Minutas
│   │   Dados: tabela `contratos`
│   │
│   ├── KPIs: Em redação · Em assinatura digital · SLA aprovação · Atrasados
│   ├── Botões: [Importar minuta] [Novo contrato]
│   │
│   ├── Filtro de status:
│   │   Todos · Aguardando assinatura · Em redação · Em assinatura digital · Assinado
│   │
│   ├── Tabela de contratos
│   │
│   └── Painel de detalhe  (ao selecionar contrato):
│       ├── Redator automático de cláusulas confidenciais
│       └── [Enviar para assinatura digital]
│
│
├── 🪖 INSTALAÇÃO & CHECKLIST
│   │
│   ├── Lista de ordens de instalação por projeto
│   ├── Checklist por etapa  (NR-18 · ABNT NBR 16858)
│   └── Barra de progresso por projeto
│
│
├── 🚢 IMPORTAÇÃO
│   │   Dados: tabela `embarques`
│   │
│   ├── KPIs: Em trânsito · Aguard. liberação · Alertas ETA · Valor em trânsito
│   │
│   ├── Abas da página:
│   │   ├── Embarques  (aba padrão)
│   │   ├── Documentos & BL
│   │   └── Aduana
│   │
│   ├── Filtro de status: Todos · Em trânsito · Liberação aduaneira · Entregue
│   ├── Filtros: [Porto] [Linha]
│   │
│   ├── Tabela:
│   │   Embarque · Navio/BL · Rota (origem → destino) · ETA ·
│   │   Progresso % · Canal aduaneiro · Status · [→ detalhe]
│   │
│   └── Botões:
│       ├── [Inbox]  ──────────────────────────────────→  📧 IMPORTAÇÃO EMAIL
│       ├── [Mapa de navios]  ──────────────────────────→  🗺️  MAPA MARÍTIMO
│       └── [Novo embarque]  →  toast "próxima fase"
│
│   ├── 📋 IMPORTAÇÃO DETAIL  (abre ao clicar na linha)
│   │   │
│   │   ├── [‹ Voltar para Importação]
│   │   ├── Header: ID · Linha naviera · Navio · BL · containers · cliente
│   │   │          Status badge · Canal aduaneiro badge
│   │   ├── Botões: [Ver no mapa] [Email fornecedor] [Reportar chegada]
│   │   │   └── "Ver no mapa"  →  /importacao-rastreamento
│   │   │
│   │   ├── Card "Linha do tempo do embarque"  (milestones)
│   │   │   └── Etapas: Saída Shanghai → Transbordo → Alto mar → Aduana → Entrega
│   │   │       Estado por etapa: done / current / future
│   │   │
│   │   ├── Card "Posição atual do navio"
│   │   │   ├── Mapa SVG interativo (corredor China–Brasil)
│   │   │   ├── [🔄 Atualizar]
│   │   │   └── KPIs: Posição lat/lng · Velocidade (kn) · Rumo (°) · ETA atualizada
│   │   │
│   │   ├── Card "Documentos"  (grid de arquivos)
│   │   │   ├── BL · Commercial Invoice · Packing List · DI · CE-Mercante
│   │   │   └── [+ Adicionar documento]
│   │   │
│   │   ├── Card "Container"  (dados fixos)
│   │   │   └── BL · Linha · Navio · Quantidade · Origem · Destino
│   │   │
│   │   ├── Card "Datas"
│   │   │   ├── ETD · ETA original · ETA atualizada
│   │   │   └── Alerta de atraso  (se ETA ≠ ETA original)
│   │   │
│   │   └── Card "Trigger Financeiro"
│   │       ├── Gatilho vinculado ao embarque (ex: Pagamento 50% no embarque)
│   │       ├── Valor do gatilho
│   │       └── [Ver no Financeiro →]
│   │
│   ├── 🗺️  MAPA MARÍTIMO  (botão "Mapa de navios" ou "Ver no mapa")
│   │   │
│   │   ├── [‹ Voltar para Importação]
│   │   ├── Header: n° de navios em trânsito
│   │   ├── Botões: [🔄 Atualizar] [Exportar relatório]
│   │   │
│   │   ├── Mapa SVG interativo  (corredor China–Brasil · lat -50→50 / lng -75→130)
│   │   │   └── Ícone de navio clicável por embarque (destaque no selecionado)
│   │   │
│   │   └── Painel lateral direito:
│   │       ├── Lista de navios em trânsito  (card por navio)
│   │       │   └── Vessel · progresso% · linha · BL · velocidade kn · rumo · ETA
│   │       │       (fundo preto = selecionado · faixa amarela lateral)
│   │       └── Card "Detalhe"  (do navio selecionado)
│   │           ├── Cliente · Conteúdo · Trajeto · ETA
│   │           └── [Abrir embarque →]
│   │
│   └── 📧 INBOX IMPORTAÇÃO  (botão "Inbox")
│       ├── Lista de e-mails  (fornecedores · agentes · aduana)
│       └── Painel de leitura de mensagem selecionada
│
│
├── 🔍 CATÁLOGO DE PRODUTOS
│   │   Dados: tabela `ncm_solicitacoes`
│   │
│   ├── Busca por SKU / descrição / NCM
│   ├── Filtros: categoria · status NCM
│   ├── Grid/lista de produtos com ficha técnica resumida
│   └── Clique no produto  →  detalhe NCM embutido (mesmo componente NcmDetailPage)
│
│
├── 🚛 COMPRAS NACIONAL
│   │
│   ├── Lista de ordens de compra nacionais
│   ├── Filtro de status:
│   │   Solicitado · Aprovado · Em cotação · Pedido emitido · Entregue
│   ├── Tabela: OC · Fornecedor · Itens · Valor · Prazo · Status
│   ├── [Nova OC]
│   └── [Inbox]  ──────────────────────────────────────→  📧 INBOX COMPRAS
│
│   └── 📧 INBOX COMPRAS  (botão "Inbox")
│       ├── Lista de e-mails  (fornecedores nacionais)
│       └── Painel de leitura de mensagem selecionada
│
│
├── ⏱️  GATILHOS & PRAZO REVERSO  🔒 financeiro · admin
│   │   Dados: tabela `gatilhos`
│   │
│   ├── KPIs: A receber 30d · Gatilhos próx. 7d · Em atraso · Recebido mês
│   │
│   ├── Alerta de urgência  (banner vermelho — aparece se há gatilhos vencendo em ≤ 2 dias)
│   │   └── [Ver agora →]
│   │
│   ├── Botões: [Exportar fluxo CSV/Excel] [Novo gatilho]
│   │
│   └── Card "Gatilhos Ativos"  (um bloco por projeto)
│       ├── Cabeçalho: Projeto · Gatilho · Valor · Vencimento · cor por prazo
│       ├── Status badge: OK (verde) · Atenção (amarelo) · Pendente (vermelho)
│       ├── [Confirmar]  (destaque laranja se ≤ 2 dias)
│       └── Barra "Prazo Reverso":
│           ├── Base: data de instalação contratada
│           └── Cadeia de etapas:
│               Pedido ao fornecedor → Embarque → Chegada Porto →
│               Desembaraço → Entrega obra → Instalação
│               (cores: success = done · warning = próximo · current = hoje)
│
│
├── 🏆 COMISSÕES  🔒 financeiro · admin
│   │   Dados: tabela `comissoes`
│   │
│   ├── KPIs: Total Q2 · Aprovado · Aguardando · Maior comissão individual
│   │
│   ├── Botões: [Folha de pagamento] [Aprovar todas]
│   │
│   └── Tabela "Resumo por vendedor":
│       Vendedor · Projetos fechados · Faturamento líquido · % comissão ·
│       Comissão Q2 · Progresso (barra) · Status · [detalhe]
│
│
├── 🔔 NOTIFICAÇÕES — Central de Alertas
│   │   Dados: tabela `alertas` (resolved = false)
│   │
│   ├── Filtro por módulo  (Comercial · Engenharia · Financeiro · Logística)
│   ├── Filtro por nível  (danger · warning · info)
│   ├── Cards de alerta com timestamp
│   └── [Marcar como resolvido]  por card
│
│
└── ⚙️  CONFIGURAÇÕES  🔒 admin
    ├── Ajustes gerais do sistema
    ├── Gestão de perfis e permissões
    └── Integrações  (em breve)
```

---

## Painel de Tweaks (modo desenvolvimento)

Botão flutuante no canto inferior direito da tela:

```
⚙ Tweaks
├── Aparência
│   ├── Densidade:  [Compacta] [Confortável] [Arejada]
│   └── Sidebar colapsada:  toggle on/off
├── Perfil ativo
│   └── Dropdown: Comercial / Engenharia / Financeiro / Admin
└── Navegação rápida
    └── Dropdown com todas as telas → pula direto para qualquer rota
```

---

## Banco de Dados (`jxtqwzmpgofwctqajewt`)

| Tabela             | Alimenta                                                      |
|--------------------|---------------------------------------------------------------|
| `leads`            | Pipeline de Leads · Lead Detail · Precificação (convertidos) |
| `cotacoes`         | Cotações China · Cotação Detail                               |
| `projetos`         | Engenharia · Gantt do Dashboard                               |
| `alertas`          | Dashboard (alertas críticos) · Notificações                   |
| `tarefas`          | "Minhas Tarefas" no Dashboard (filtradas por role)            |
| `embarques`        | Importação · Importação Detail · Mapa Marítimo                |
| `contratos`        | Jurídico                                                      |
| `estoque`          | "Estoque Crítico" no Dashboard                                |
| `comissoes`        | Comissões                                                     |
| `gatilhos`         | Gatilhos & Prazo Reverso · Dashboard (KPI 7d)                 |
| `ncm_solicitacoes` | NCM Kanban · Catálogo de Produtos · Dashboard (contadores)    |

---

## SSO — Acesso exclusivo via vpsistema.com

O sistema **bloqueia acesso direto por URL**. O colaborador entra obrigatoriamente
pelo card "Cotação Importação | PRD" no portal `vpsistema.com`, que injeta
`?sso_token=...&sso_refresh=...` na URL.

O guard em `src/supabase.js` (roda antes do React montar):
- **Token presente** → `sb.auth.setSession()` → salva sessão → limpa URL
- **Sessão salva** (localStorage) → acesso permitido (retorno)
- **Flag de aba** (sessionStorage) → acesso permitido (mesmo tab)
- **Nenhum dos anteriores** → `window.location.replace('https://vpsistema.com')`

---

## Estrutura de Arquivos

```
vpprd_claudeDesigner/
├── index.html                  # Entry point — carrega todos os scripts em ordem
├── server.js                   # Express — serve arquivos estáticos (Hostinger)
├── package.json
├── .env.example                # Documenta que não há env vars obrigatórias
├── src/
│   ├── supabase.js             # Client Supabase + SSO Guard + loadDashboardData()
│   ├── data.js                 # Dados de referência estáticos
│   ├── ncm-data.js             # Catálogo NCM + atributos por NCM + fabricantes
│   ├── app.jsx                 # Roteador principal (switch de routes)
│   ├── shell.jsx               # Sidebar + Header + NAV_GROUPS + role switcher
│   ├── dashboard.jsx           # KPIs · Pipeline · Gantt · Estoque · Alertas · Tarefas
│   ├── comercial.jsx           # LeadsPage · LeadDetail · CotacoesPage · CotacaoDetail
│   ├── precificacao.jsx        # PrecificacaoPage · calculadora de margem
│   ├── proposta-form.jsx       # Wizard de criação de proposta
│   ├── proposta-preview.jsx    # Preview PDF da proposta
│   ├── proposta-editor.jsx     # Editor completo de proposta (3 equipamentos)
│   ├── ncm.jsx                 # NCMStepper · NCMTab · NcmKanbanPage · Modal LogComex
│   ├── ncm-catalogo.jsx        # NcmCatalogoPage · NcmDetailPage
│   ├── operacoes.jsx           # EngenhariaPage · JuridicoPage · InstalacaoPage
│   ├── logistica.jsx           # ImportacaoPage · ImportacaoDetail · ImportacaoRastreamento
│   │                           # EmailInbox · ComprasPage
│   ├── financeiro.jsx          # FinanceiroPage · ComissoesPage ·
│   │                           # NotificacoesPage · ConfiguracoesPage
│   ├── primitives.jsx          # Button · Badge · KPI · Card · Tabs · StatusBadge…
│   └── toast.jsx               # Sistema de toasts (success · warning · danger · info)
├── styles/
│   ├── app.css                 # Layout principal · sidebar · header · tabelas
│   ├── modules.css             # Componentes de módulos
│   ├── proposta-editor.css     # Editor de propostas
│   └── ncm.css                 # Módulo NCM (stepper · cards · alertas)
├── colors_and_type.css         # Design tokens: var(--vp-*) · tipografia
├── assets/
│   └── logo-mark-yellow.png
└── .claude/
    ├── 2026_05_24_relatorio.md # Relatório de lançamento — 24/05/2026
    └── relatorio.md            # Guia operacional futuro
```

---

## Deploy

```
Plataforma:   Hostinger Node.js
Branch:       main  (auto-deploy a cada git push)
Node.js:      18.x
Comando:      node server.js
PORT:         injetada automaticamente pelo Hostinger (process.env.PORT)
Env vars:     nenhuma necessária
Supabase:     anon key em src/supabase.js (chave pública — seguro no frontend)
```

```bash
# Deploy (qualquer push na main dispara deploy automático ~2 min)
git add .
git commit -m "feat: descrição da mudança"
git push origin main
```

---

*Documentação gerada em 24/05/2026 — Claude Sonnet 4.6*

---

## Contributors

- Gelson Simões — criador e responsável pelas soluções VerticalParts

---

**Feito por Gelson Simões**
