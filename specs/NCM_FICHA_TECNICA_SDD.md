# VP Gestão — SDD: Módulo NCM / Ficha Técnica
**Versão:** 1.0  
**Data:** 2026-05-23  
**Autor:** VerticalParts  
**Status:** Pronto para Design

---

## COMANDO PARA CLAUDE DESIGNER

> Crie as telas abaixo para o sistema **VP Gestão** da VerticalParts.
> O sistema usa **dark mode** com fundo `#0D0D0D`, sidebar preta, acentos em **amarelo `#F5C800`**, tipografia sans-serif (Inter ou similar), bordas `#2A2A2A`, textos primários em branco `#FFFFFF`, textos secundários em `#888888`. Badges/status seguem padrão: verde `#22C55E`, amarelo `#F5C800`, laranja `#F97316`, vermelho `#EF4444`, azul `#3B82F6`. Botões primários: fundo `#F5C800` texto preto. Botões secundários: borda `#2A2A2A` texto branco. O sistema já existe — estas são telas **novas** que se integram ao layout existente mostrado abaixo.

---

## REFERÊNCIA VISUAL DO SISTEMA EXISTENTE

O sistema VP Gestão tem:
- **Sidebar esquerda** preta, largura 240px, logo VerticalParts no topo, navegação por seções: GERAL / COMERCIAL / OPERAÇÕES / LOGÍSTICA / FINANCEIRO / ADMIN
- **Topbar** com breadcrumb, busca global, módulos em destaque (COMERCIAL | ENGENHARIA | FINANCEIRO | ADMIN), sino de notificações, avatar do usuário
- **Área principal** com header da página (título H1 bold, subtítulo em cinza), KPI cards em linha, e conteúdo principal com painel dividido (lista à esquerda, detalhe à direita)
- **Padrão de abas** nos detalhes: linha horizontal com abas em texto maiúsculo, aba ativa com underline amarelo

---

## TELA 1 — ABA "NCM / FICHA TÉCNICA" NA ENGENHARIA

### Contexto
Esta aba é a **quinta aba** do painel de detalhe de um projeto de engenharia.
Ela aparece **sempre**, mas com estado diferente conforme o produto já tenha NCM cadastrado ou não.

### Localização
```
vp-gestao / Operações / Engenharia → Detalhe do projeto → Aba 5
```

### Layout da Aba no Painel de Detalhe

```
DETALHE: ENG-148 · COND. PARK TOWER          [↑ ANEXAR]  [✓ APROVAR LAUDO]
modernização 4 elevadores Schindler 9300AE

[ LAUDO TÉCNICO ] [ DOCUMENTOS 12 ] [ BOM 24 ] [ VISITA ] [ NCM / FICHA TÉCNICA ● ]
                                                                        ↑
                                             Ponto laranja quando status = pendente
                                             Ponto verde quando status = cadastrado
```

---

### BLOCO 1 — BANNER DE STATUS DO CADASTRO NCM

**Componente:** Banner horizontal com 5 etapas em linha (stepper), ocupa 100% da largura da aba.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ○ NÃO INICIADO  →  ◉ EM PREENCHIMENTO  →  ○ AGUARD. JURÍDICO  →  ○ APROVADO  →  ○ CADASTRADO SISCOMEX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Regras visuais do stepper:**
- Etapa atual: círculo preenchido amarelo `#F5C800`, texto branco bold
- Etapas concluídas: círculo preenchido verde `#22C55E` com ícone `✓`, texto cinza
- Etapas futuras: círculo vazio, borda `#2A2A2A`, texto cinza `#888888`
- Linha conectora: tracilhada cinza entre etapas; trecho até etapa atual fica amarelo
- Abaixo do stepper: texto descritivo da etapa atual em cinza, ex: *"Engenharia preenche a ficha técnica e anexa imagens do produto"*

**Estados possíveis:**
| Status | Cor do badge na aba |
|---|---|
| NÃO INICIADO | Laranja `#F97316` |
| EM PREENCHIMENTO | Amarelo `#F5C800` |
| AGUARD. JURÍDICO | Azul `#3B82F6` |
| APROVADO | Verde `#22C55E` |
| CADASTRADO SISCOMEX | Verde escuro, ícone ✓ |

---

### BLOCO 2 — IDENTIFICAÇÃO DO PRODUTO (Catálogo Receita Federal)

**Título da seção:** `IDENTIFICAÇÃO PARA O CATÁLOGO DA RECEITA FEDERAL` em texto uppercase cinza `#888888`, tamanho 11px, com linha separadora amarela à esquerda (3px, estilo do sistema).

#### Campo: Denominação do Produto
- **Label:** `Denominação do produto *` (asterisco vermelho = obrigatório)
- **Tipo:** Input text, largura 100%
- **Limite:** 100 caracteres
- **Contador:** canto inferior direito do campo, ex: `47/100`, muda para vermelho quando > 90
- **Placeholder:** `Ex: Elevador elétrico de tração, uso comercial, capacidade 630 kg`
- **Tooltip (ícone ⓘ ao lado do label):** *"Máximo 100 caracteres. Descreva em português, sem abreviações. Esta informação identifica primariamente o produto no Catálogo da Receita Federal."*
- **Validação:** obrigatório, mínimo 10 caracteres, sem caracteres especiais inválidos

#### Campo: NCM
- **Label:** `Código NCM *`
- **Tipo:** Input com busca typeahead (3+ dígitos para ativar)
- **Largura:** 180px (ao lado da Descrição NCM)
- **Dropdown de busca:** mostra código + descrição oficial, ex: `8428.10.00 — Elevadores e monta-cargas`
- **Após seleção:** exibe badge `● ATIVO` verde e descrição completa da NCM em texto cinza abaixo
- **ALERTA CRÍTICO:** Ao selecionar o NCM, exibir banner de aviso imediatamente abaixo do campo:

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚠  ATENÇÃO: O código NCM NÃO pode ser alterado após o envio       │
│     para o Catálogo da Receita Federal. Em caso de erro, o         │
│     produto deverá ser DESATIVADO e um novo cadastrado.            │
│     Confirme com o jurídico antes de avançar.                      │
└─────────────────────────────────────────────────────────────────────┘
```
- Cor do banner: fundo `#2A1500`, borda esquerda `#F97316`, texto `#F97316`
- **Campo Descrição NCM:** readonly, preenche automaticamente após seleção do código, largura expandida

#### Campo: Detalhamento Complementar do Produto
- **Label:** `Detalhamento complementar`
- **Tipo:** Textarea, altura mínima 120px, redimensionável verticalmente
- **Limite:** 3.700 caracteres
- **Contador:** `0/3700` no canto inferior direito, muda para amarelo em 3000, vermelho em 3500
- **Placeholder:**
  ```
  Descreva detalhadamente: tipo de acionamento, potência do motor (kW), 
  velocidade nominal (m/s), capacidade de carga (kg), número de paradas, 
  tensão de alimentação, tipo de cabine, normas técnicas aplicáveis (ABNT, EN).
  Não repita informações já incluídas na Denominação do Produto.
  ```
- **Tooltip (ⓘ):** *"Campo para informações técnicas detalhadas que não couberam na Denominação. A Receita Federal usa esta descrição para verificar a classificação NCM. Uma boa descrição evita multas e atrasos no desembaraço."*

#### Campo: Atributos da NCM (dinâmico)
- **Label da seção:** `ATRIBUTOS TÉCNICOS DA NCM`
- **Exibição:** Os atributos aparecem **somente após o NCM ser selecionado**
- **Animação:** fade-in + slide-down ao aparecer
- **Layout:** grid 2 colunas, cada atributo tem label + input/select/radio conforme tipo

**Atributos padrão para NCM de elevadores (8428.10.00):**

| Atributo | Tipo de Campo | Exemplo de valor |
|---|---|---|
| Tipo de acionamento | Select | Elétrico tração / Elétrico hidráulico / Pneumático |
| Capacidade de carga (kg) | Input número | 630 |
| Velocidade nominal (m/s) | Input decimal | 1.0 |
| Potência do motor (kW) | Input decimal | 7.5 |
| Número de paradas | Input inteiro | 8 |
| Uso | Radio | Residencial / Comercial / Industrial |
| Tensão de alimentação | Select | 220V / 380V / 440V |
| Possui casa de máquinas? | Toggle sim/não | Não |

- **Campos obrigatórios** marcados com `*`
- **Campos opcionais** sem marcação
- Atributos marcados como obrigatório pela Receita: borda do input em amarelo quando não preenchidos

---

### BLOCO 3 — FABRICANTE/PRODUTOR (Operador Estrangeiro)

**Título da seção:** `FABRICANTE / PRODUTOR ESTRANGEIRO`

**Sub-componente de busca no topo:**
```
[ 🔍 Buscar fornecedor já cadastrado...        ]   [+ NOVO FABRICANTE]
```
- Ao digitar, filtra fornecedores existentes nas Cotações China (Hangzhou Lift Co., Suzhou Vertical Equip., etc.)
- Se selecionar existente: campos preenchem automaticamente, desabilitados (readonly), com badge `● JÁ CADASTRADO`
- Se clicar em `+ NOVO FABRICANTE`: formulário abre em modo edição

**Campos do fabricante (grid 2 colunas):**

| Campo | Obrigatoriedade | Observação |
|---|---|---|
| Nome do fabricante/produtor | Obrigatório | Text input |
| País de origem | Obrigatório, **não retificável** | Select com bandeirinha + nome do país |
| Logradouro (endereço) | Obrigatório | Text input |
| Cidade | Obrigatório | Text input |
| Subdivisão (estado/província) | Opcional | Text input |
| CEP / Código postal | Opcional | Text input |
| E-mail | Opcional | Text input type email |
| TIN (Número de identificação fiscal) | Opcional mas recomendado | Text input |
| Código interno | Opcional | Text input |

**Tooltip no TIN (ⓘ):** *"Tax Identification Number — número fiscal único do operador estrangeiro, conforme padrão OMA. Obtenha com o próprio fabricante. Altamente recomendado pois agiliza o processo na Duimp."*

**Banner informativo abaixo do campo País:**
```
ℹ  O País do Operador Estrangeiro também não pode ser alterado após o cadastro.
   Em caso de erro, o operador deverá ser desativado e um novo cadastrado.
```
Cor: fundo `#0D1A2A`, borda `#3B82F6`, texto `#3B82F6`

---

### BLOCO 4 — FICHA TÉCNICA E IMAGENS DO PRODUTO

**Título da seção:** `FICHA TÉCNICA E IMAGENS`

**Subtítulo em cinza:** *"O pessoal de importação fará o download das imagens para envio à Receita Federal. Anexe no mínimo 1 imagem e a ficha técnica do fabricante."*

#### Upload de Imagens (5 slots)

Layout: 5 cards em linha horizontal, cada um com 160×140px.

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│          │  │          │  │          │  │          │  │          │
│  [img 1] │  │  [img 2] │  │  [img 3] │  │  [img 4] │  │  [img 5] │
│          │  │          │  │          │  │          │  │          │
│ Imagem 1 │  │ Imagem 2 │  │ Imagem 3 │  │ Imagem 4 │  │ Imagem 5 │
│ [+ add]  │  │ [+ add]  │  │ [+ add]  │  │ [+ add]  │  │ [+ add]  │
└──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

**Cada slot vazio:**
- Borda tracejada `#2A2A2A`, fundo `#111111`
- Ícone de câmera centralizado em `#444444`
- Label `Imagem N` abaixo
- Botão `+ Adicionar` em texto amarelo
- Aceita: JPG, PNG, WEBP — máximo 5MB por imagem

**Cada slot preenchido:**
- Exibe thumbnail da imagem (object-fit: cover)
- Hover: overlay escuro com dois ícones: `👁 Ver` e `🗑 Remover`
- Badge `✓` verde no canto superior direito
- Label editável: clique para renomear (ex: "Vista frontal", "Plaqueta técnica")

**Drag and drop:** suporta arrastar imagem diretamente para qualquer slot. Indicador visual de drop zone (borda amarela + fundo levemente amarelo translúcido) ao arrastar.

#### Upload da Ficha Técnica PDF

```
┌──────────────────────────────────────────────────────────────────────┐
│  📄  Ficha Técnica do Fabricante (PDF)                    [ANEXAR]   │
│      Arraste o arquivo aqui ou clique em Anexar                      │
│      Formatos aceitos: PDF · Tamanho máximo: 20MB                    │
└──────────────────────────────────────────────────────────────────────┘
```

Após upload: exibe nome do arquivo, tamanho, data de upload, botões `Visualizar` e `Remover`.

#### Botão de Download para Importação

```
                    ┌─────────────────────────────────────┐
                    │  ⬇  BAIXAR TODAS AS IMAGENS (.zip)  │
                    └─────────────────────────────────────┘
```
- Botão secundário, largura auto, alinhado à direita da seção
- Só habilitado quando há pelo menos 1 imagem anexada
- Gera `.zip` com as imagens nomeadas: `VP_NCM_[codigo]_img1.jpg`, `VP_NCM_[codigo]_img2.jpg`, etc.
- **Tooltip:** *"Gera um arquivo .zip com todas as imagens para o pessoal de importação fazer upload no Portal da Receita Federal."*
- Ao clicar: toast de confirmação `"Download iniciado — 3 imagens exportadas"`

---

### BLOCO 5 — AÇÕES E RODAPÉ DA ABA

**Layout:** barra fixa no rodapé da aba, fundo `#111111`, borda superior `#2A2A2A`, padding 16px.

#### Estado: EM PREENCHIMENTO (Engenharia preenchendo)

```
[Salvar rascunho]                    [Enviar para revisão Jurídica →]
```
- `Salvar rascunho`: botão secundário — salva sem validação completa
- `Enviar para revisão Jurídica`: botão primário amarelo — valida todos os campos obrigatórios antes de enviar
  - Se houver campos vazios: scroll automático para o primeiro campo com erro, borda vermelha + mensagem inline
  - Se válido: modal de confirmação (ver abaixo)

**Modal de confirmação de envio para Jurídico:**
```
┌────────────────────────────────────────────────────────────────────┐
│  Enviar Ficha Técnica para Revisão Jurídica?                       │
│                                                                    │
│  Produto: Elevador elétrico de tração, uso comercial, 630 kg       │
│  NCM: 8428.10.00 — Elevadores e monta-cargas                       │
│                                                                    │
│  ⚠  Após o envio, o NCM não poderá ser alterado por Engenharia.   │
│     Somente o Jurídico poderá solicitar correção antes de          │
│     aprovar o cadastro.                                            │
│                                                                    │
│           [Cancelar]        [Confirmar e Enviar →]                 │
└────────────────────────────────────────────────────────────────────┘
```

#### Estado: AGUARD. JURÍDICO (campos bloqueados para Engenharia)

```
[Editar — solicitar devolução]               [Aguardando aprovação jurídica...]
```
- Todos os campos ficam readonly/desabilitados
- Badge azul `● AGUARDANDO JURÍDICO` no topo
- `Editar — solicitar devolução`: abre modal pedindo justificativa, devolve para EM PREENCHIMENTO

#### Estado: APROVADO pelo Jurídico

```
[Ver aprovação]                      [Exportar para LogComex →]   [Marcar como cadastrado no Siscomex ✓]
```
- Banner verde no topo: `✓ Aprovado pelo jurídico · Marina A. · 19/mai 14:30`
- `Exportar para LogComex`: abre modal com instruções + checklist de dados (ver Tela 2)
- `Marcar como cadastrado no Siscomex`: confirmação manual — abre campo para inserir o Código do Produto gerado pelo Siscomex

#### Estado: CADASTRADO SISCOMEX

```
Código Siscomex: PRD-0000000042   Versão: 1   Situação: ● ATIVO
Cadastrado por: Wilson F. · 22/mai/2026
```
- Campos todos readonly, visual "congelado"
- Badge verde `● CADASTRADO SISCOMEX`
- Link para visualizar no LogComex

---

## TELA 2 — MODAL: EXPORTAR PARA LOGCOMEX

**Tipo:** Modal centralizado, 680px largura, fundo `#111111`, borda `#2A2A2A`.

**Título:** `Exportar para LogComex — Catálogo de Produtos`

### Conteúdo do modal:

#### Seção: Resumo do produto para conferência
```
┌──────────────────────────────────────────────────────────────┐
│  NCM:           8428.10.00                                   │
│  Denominação:   Elevador elétrico de tração, uso comercial.. │
│  Fabricante:    Hangzhou Lift Co. · China · TIN: CN123456    │
│  Imagens:       3 anexadas                                   │
│  Ficha técnica: Datasheet_HLC_9300.pdf                       │
└──────────────────────────────────────────────────────────────┘
```

#### Seção: Checklist de pré-envio
Cada item tem checkbox que o usuário deve marcar antes de prosseguir:

- [ ] Confirmei que o código NCM está correto e validado pelo jurídico
- [ ] A Denominação do Produto está em português, sem abreviações
- [ ] O Detalhamento Complementar descreve suficientemente o produto
- [ ] Os atributos obrigatórios da NCM foram preenchidos
- [ ] O fabricante/produtor está identificado corretamente
- [ ] As imagens representam fielmente o produto a ser importado

#### Seção: Instruções de envio ao LogComex
```
ℹ  O VP Gestão não envia diretamente ao Siscomex.
   Após confirmar o checklist, os dados serão copiados em formato
   estruturado para você colar no plataforma.logcomex.

   1. Clique em "Copiar dados formatados"
   2. Acesse plataforma.logcomex → Catálogo de Produtos → Novo Produto
   3. Cole os dados nos campos correspondentes
   4. Anexe as imagens baixadas via botão "Baixar todas as imagens"
   5. Ative o produto e copie o Código Siscomex gerado
   6. Volte aqui e clique "Marcar como cadastrado" inserindo o código
```

#### Rodapé do modal
```
[Cancelar]      [Copiar dados formatados 📋]      [Baixar imagens .zip ⬇]
```
- `Copiar dados formatados`: copia para clipboard um JSON estruturado com todos os campos
- `Baixar imagens .zip`: mesmo comportamento do botão no Bloco 4
- Após clicar em "Copiar": botão muda para `✓ Copiado!` por 3 segundos

---

## TELA 3 — CATÁLOGO INTERNO DE PRODUTOS

**Rota:** `vp-gestao / Logística / Importação / Catálogo de Produtos`

**Posição no menu:** subnav dentro de Importação, ou item próprio em Logística.

### Header da página
```
LOGÍSTICA · CATÁLOGO DE PRODUTOS

CATÁLOGO DE PRODUTOS
Produtos cadastrados no Catálogo da Receita Federal (Siscomex/Duimp)

[🔍 Buscar produto, NCM, fornecedor...]              [+ NOVO PRODUTO]
```

### KPI Cards (4 cards em linha)

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ PRODUTOS ATIVOS │ │ AGUARD. JURÍDICO │ │ EM PREENCHIMENTO│ │  NCMs DISTINTAS │
│      47         │ │       3         │ │       2         │ │      12         │
│  +2 esse mês    │ │   ↑ +1          │ │                 │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Filtros em linha abaixo dos KPIs
```
[Todos ▼]  [Status ▼]  [NCM ▼]  [Fabricante ▼]  [Período ▼]      Mostrando 47 produtos
```

### Tabela de Produtos

Colunas:
| Coluna | Largura | Conteúdo |
|---|---|---|
| CÓDIGO SISCOMEX | 140px | `PRD-0000000042` ou `— rascunho` |
| DENOMINAÇÃO | flex | Nome + NCM em linha abaixo em cinza |
| NCM | 120px | Código badge cinza escuro |
| FABRICANTE | 160px | Nome + bandeirinha do país |
| VERSÃO | 80px | `v1`, `v2`, etc. |
| STATUS | 120px | Badge colorido |
| ATUALIZADO | 100px | Data relativa: "há 3d" |
| AÇÕES | 80px | `···` menu: Ver / Copiar / Nova versão / Desativar |

**Estados dos badges:**
- `● ATIVO` verde
- `● RASCUNHO` cinza
- `● AGUARD. JURÍDICO` azul
- `● EM PREENCHIMENTO` amarelo
- `● DESATIVADO` vermelho, texto tachado na linha

**Hover na linha:** fundo `#1A1A1A`, cursor pointer, abre painel lateral com resumo

**Ao clicar em uma linha:** expande painel de detalhe lateral (igual ao padrão do sistema) com todas as informações e abas: Dados Básicos | Atributos | Imagens | Histórico de Versões

### Painel de detalhe lateral — aba Histórico de Versões

```
HISTÓRICO DE ALTERAÇÕES

Data/Hora          Versão    Situação      Usuário           Observação
22/mai/26 09:00    v1        Ativo         Wilson F.         Criação do produto
15/abr/26 11:30    v1        Rascunho      Daniel O.         Inclusão inicial
```

---

## TELA 4 — SOLICITAÇÕES DE CLASSIFICAÇÃO NCM (PAINEL DE ACOMPANHAMENTO)

**Rota:** `vp-gestao / Operações / Engenharia / Solicitações NCM`
**Ou:** acessível também via `Importação → Solicitações NCM`

**Descrição:** Painel Kanban/lista mostrando todas as solicitações de classificação em andamento, para gestores acompanharem o pipeline.

### Header
```
OPERAÇÕES · ENGENHARIA · SOLICITAÇÕES NCM

SOLICITAÇÕES DE CLASSIFICAÇÃO NCM
Produtos pendentes de descrição técnica, validação jurídica e cadastro Siscomex
```

### Visão Kanban (padrão de colunas)

```
┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ EM PREENCHI-  │  │ AGUARD.       │  │   APROVADO    │  │ PRONTO PARA   │  │   CADASTRADO  │
│    MENTO      │  │  JURÍDICO     │  │   JURÍDICO    │  │  LOGCOMEX     │  │   SISCOMEX    │
│     (2)       │  │     (3)       │  │     (1)       │  │     (2)       │  │    (41)       │
├───────────────┤  ├───────────────┤  ├───────────────┤  ├───────────────┤  ├───────────────┤
│ Card produto  │  │ Card produto  │  │ Card produto  │  │ Card produto  │  │ Card produto  │
│               │  │               │  │               │  │               │  │               │
└───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘
```

### Card de produto (em cada coluna Kanban)

```
┌────────────────────────────────┐
│  ENG-148 · COND. PARK TOWER   │
│  Elevador elétrico tração     │
│  NCM: 8428.10.00              │
│  ─────────────────────────    │
│  👤 Daniel O.  📅 há 2d       │
│  ● EM PREENCHIMENTO           │
│                          [→]  │
└────────────────────────────────┘
```

- Clicar no card: navega para a aba NCM/Ficha Técnica do projeto de engenharia correspondente
- `[→]`: abre detalhe rápido em painel lateral sem sair da tela

### Alternativa de visualização: Lista

Botão toggle no canto superior direito: `▤ Lista` / `⠿ Kanban`

Na visão lista: tabela com colunas — Projeto, Produto, NCM, Responsável, Status, Há quanto tempo, Ações.

---

## TELA 5 — NOTIFICAÇÕES RELACIONADAS AO FLUXO NCM

As notificações existentes no VP Gestão (tela 21 do tour) devem incluir os seguintes eventos do fluxo NCM:

### Notificações disparadas automaticamente:

| Evento | Quem recebe | Mensagem |
|---|---|---|
| Cotação aprovada com produto sem NCM | Responsável de Engenharia | `"Nova ficha técnica necessária — [produto] · [projeto]"` |
| Engenharia submete para Jurídico | Advogado responsável | `"Ficha técnica aguarda validação NCM — [produto]"` |
| Jurídico aprova | Engenharia + Importação | `"NCM aprovado — [produto] pronto para exportar ao LogComex"` |
| Jurídico devolve para Engenharia | Engenheiro responsável | `"Ficha técnica devolvida — [produto] — [motivo do jurídico]"` |
| Importação marca como cadastrado | Gestores de importação | `"Produto cadastrado no Siscomex — [produto] · código [xxx]"` |

### Ícone de módulo: `📦` para todas as notificações do módulo NCM/Ficha Técnica

---

## TELA 6 — INDICADORES NO DASHBOARD PRINCIPAL

No Dashboard existente, adicionar ao painel de alertas:

```
PENDÊNCIAS NCM
─────────────────────────────────────────────────
⚠  2 fichas técnicas em preenchimento há +5 dias
⚠  3 produtos aguardando validação jurídica
✓  1 produto aprovado aguardando cadastro LogComex
```

Link "Ver todas" navega para a Tela 4 (Solicitações NCM).

---

## ESTADOS DE CARREGAMENTO E FEEDBACK

### Skeleton loading
- Ao carregar os atributos dinâmicos da NCM: exibir 4 retângulos animados (skeleton) enquanto busca via API
- Ao carregar o catálogo de produtos: skeleton de 5 linhas de tabela

### Toast notifications (canto inferior direito)
- Sucesso: fundo `#052e16`, borda `#22C55E`, ícone `✓`, texto branco — ex: `"Rascunho salvo com sucesso"`
- Erro: fundo `#2d0000`, borda `#EF4444`, ícone `✗`, ex: `"Erro ao salvar — tente novamente"`
- Info: fundo `#0c1a2e`, borda `#3B82F6`, ícone `ℹ`, ex: `"Enviado para revisão jurídica"`
- Duração: 4 segundos, com botão `✕` para fechar

### Estados de campos inválidos
- Borda vermelha `#EF4444` + mensagem inline abaixo do campo em vermelho tamanho 12px
- Scroll automático para o primeiro erro ao tentar avançar

---

## COMPONENTES REUTILIZÁVEIS A CRIAR

1. **`<NcmSearchInput>`** — input de busca de NCM com typeahead e descrição
2. **`<NcmAlert>`** — banner de alerta "não retificável" (reutilizável para NCM e País)
3. **`<ImageUploadSlot>`** — slot individual de imagem com preview e ações
4. **`<ImageUploadGrid>`** — grade de 5 slots `<ImageUploadSlot>`
5. **`<NcmStatusStepper>`** — stepper horizontal de 5 etapas
6. **`<ForeignOperatorForm>`** — formulário de fabricante estrangeiro com busca interna
7. **`<NcmAttributesForm>`** — formulário dinâmico de atributos por NCM
8. **`<ProductCatalogTable>`** — tabela do catálogo com painel de detalhe lateral
9. **`<ExportLogcomexModal>`** — modal de checklist + exportação

---

## INTEGRAÇÕES COM MÓDULOS EXISTENTES

| Módulo existente | Ponto de integração | Comportamento |
|---|---|---|
| **Cotações China** | Item de cotação sem NCM | Badge `⚠ SEM NCM` no item + link "Solicitar ficha técnica" |
| **Detalhe da Cotação** | Seção de produto | Exibe status NCM do produto (rascunho/ativo) |
| **Importação** | Criação de embarque | Valida se todos os produtos do embarque têm NCM ativo; bloqueia se não tiver |
| **Notificações** | Central de notificações | Eventos do fluxo NCM (listados na Tela 5) |
| **Dashboard** | Painel de alertas | Widget "Pendências NCM" |
| **Jurídico** | Fila de tarefas | Aparece na fila do advogado como "Validar NCM — [produto]" |

---

## FLUXO COMPLETO — RESUMO

```
1. COTAÇÃO APROVADA com produto novo
   └─► Alerta automático: "Produto sem NCM"
         └─► Engenharia acessa ENG-xxx → aba "NCM / Ficha Técnica"
               └─► Preenche: Denominação, NCM, Detalhamento, Atributos, Fabricante
               └─► Anexa: 5 imagens + PDF ficha técnica do fabricante
               └─► Clica "Enviar para revisão Jurídica"
                     └─► Jurídico recebe notificação
                           └─► Valida NCM e classificação fiscal
                                 └─► APROVADO: Importação é notificada
                                       └─► Acessa modal "Exportar para LogComex"
                                             └─► Baixa imagens .zip
                                             └─► Copia dados formatados
                                             └─► Cadastra no plataforma.logcomex
                                             └─► Recebe Código Siscomex (PRD-xxxxx)
                                                   └─► Marca como "Cadastrado Siscomex" no VP Gestão
                                                         └─► Produto ativo para uso na Duimp ✓
```

---

## OBSERVAÇÕES FINAIS PARA O DESIGNER

1. **Consistência visual:** seguir exatamente o design system do VP Gestão já existente (dark mode, amarelo, tipografia)
2. **Peso das ações:** NCM é irreversível — todo elemento relacionado ao envio deve ter confirmação dupla e alertas visíveis
3. **Mobile:** não é prioridade — sistema é desktop-first
4. **Acessibilidade:** labels em todos os inputs, contraste mínimo 4.5:1
5. **Responsividade do painel:** o painel de detalhe (lista + detalhe lado a lado) deve colapsar para tela cheia em viewports < 1200px
6. **Estados vazios:** quando não há produtos cadastrados, exibir empty state com ícone, texto explicativo e botão "Cadastrar primeiro produto"

---

*Documento gerado para uso no Claude Designer — VP Gestão v2.4 — VerticalParts*
