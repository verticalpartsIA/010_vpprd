-- ============================================================
-- Catálogo de Produtos (DUIMP) — modelo fiel à Receita Federal
-- Refs: P&R Catálogo de Produtos (out/2024) + API catp Portal Único
--       https://docs.portalunico.siscomex.gov.br/api/catp/
-- Duas entidades: Produtos e Operadores Estrangeiros.
-- Tela: Engenharia → Catálogo de Produtos
-- ============================================================

-- ---------- PRODUTOS ----------
CREATE TABLE IF NOT EXISTS public.catalogo_produtos (
  id              text PRIMARY KEY,                 -- id interno do app (CP-xxxxxx)
  codigo          text,                             -- código Siscomex do produto (auto)
  versao          integer DEFAULT 1,
  situacao        text DEFAULT 'rascunho',          -- rascunho | ativado | desativado
  -- não retificáveis:
  cpf_cnpj_raiz   text,                             -- CNPJ raiz do importador (8 díg.)
  modalidade      text DEFAULT 'IMPORTACAO',        -- IMPORTACAO | EXPORTACAO
  ncm             text,
  -- retificáveis:
  ncm_descricao   text,
  denominacao     text,                             -- obrigatório (máx 100)
  detalhamento    text,                             -- complementar (máx 3700)
  unidade_medida  text,                             -- estatística (da NCM)
  codigo_interno  text,                             -- código do importador (opcional)
  atributos       jsonb DEFAULT '[]'::jsonb,        -- [{codigo,nome,valor}] da NCM
  fabricantes     jsonb DEFAULT '[]'::jsonb,        -- códigos de operadores estrangeiros vinculados
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ---------- OPERADORES ESTRANGEIROS ----------
CREATE TABLE IF NOT EXISTS public.operadores_estrangeiros (
  id              text PRIMARY KEY,                 -- id interno (OE-xxxxxx)
  codigo          text,                             -- código Siscomex (auto, ex.: OPE_1)
  versao          integer DEFAULT 1,
  situacao        text DEFAULT 'ativado',           -- ativado | desativado (sem rascunho)
  -- não retificáveis:
  cpf_cnpj_raiz   text,
  pais            text,                             -- código país (ex.: CN, DE, US)
  -- retificáveis:
  nome            text,                             -- obrigatório
  logradouro      text,                             -- obrigatório
  cidade          text,                             -- obrigatório
  tin             text,                             -- nº identificação (OMA)
  email           text,
  codigo_interno  text,
  codigo_postal   text,
  subdivisao      text,                             -- estado/província
  created_at      timestamptz DEFAULT now()
);

-- ---------- RLS (anon CRUD, padrão do projeto) ----------
ALTER TABLE public.catalogo_produtos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operadores_estrangeiros ENABLE ROW LEVEL SECURITY;

CREATE POLICY cp_leitura  ON public.catalogo_produtos       FOR SELECT TO public USING (true);
CREATE POLICY cp_insert   ON public.catalogo_produtos       FOR INSERT TO public WITH CHECK (true);
CREATE POLICY cp_update   ON public.catalogo_produtos       FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY cp_delete   ON public.catalogo_produtos       FOR DELETE TO public USING (true);

CREATE POLICY oe_leitura  ON public.operadores_estrangeiros FOR SELECT TO public USING (true);
CREATE POLICY oe_insert   ON public.operadores_estrangeiros FOR INSERT TO public WITH CHECK (true);
CREATE POLICY oe_update   ON public.operadores_estrangeiros FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY oe_delete   ON public.operadores_estrangeiros FOR DELETE TO public USING (true);
