-- ============================================================
-- Engenharia · Configurador de Equipamentos
-- Especificação técnica (escada/esteira/elevador) que orienta a Compra.
-- Campos dinâmicos por tipo (params) + saídas calculadas (computed) +
-- anexos de desenhos/imagens (Supabase Storage, bucket "engenharia").
-- Tela: Engenharia → Configurador
-- ============================================================
CREATE TABLE IF NOT EXISTS public.equipamentos_spec (
  id            text PRIMARY KEY,            -- EQ-xxxxxx
  project_id    text,                        -- vínculo opcional a projetos
  referencia    text,                        -- prédio/empreendimento
  tipo          text,                        -- escada_rolante | esteira_rolante | elevador
  responsavel   text,
  status        text DEFAULT 'rascunho',     -- rascunho | finalizado
  params        jsonb DEFAULT '{}'::jsonb,   -- entradas do configurador
  computed      jsonb DEFAULT '{}'::jsonb,   -- saídas calculadas (snapshot)
  anexos        jsonb DEFAULT '[]'::jsonb,   -- [{nome,url,tipo,tamanho,path}]
  observacoes   text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE public.equipamentos_spec ENABLE ROW LEVEL SECURITY;
CREATE POLICY eq_leitura ON public.equipamentos_spec FOR SELECT TO public USING (true);
CREATE POLICY eq_insert  ON public.equipamentos_spec FOR INSERT TO public WITH CHECK (true);
CREATE POLICY eq_update  ON public.equipamentos_spec FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY eq_delete  ON public.equipamentos_spec FOR DELETE TO public USING (true);

-- ---------- Storage: bucket público para desenhos técnicos e imagens ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('engenharia', 'engenharia', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY eng_obj_read   ON storage.objects FOR SELECT TO public USING (bucket_id = 'engenharia');
CREATE POLICY eng_obj_insert ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'engenharia');
CREATE POLICY eng_obj_update ON storage.objects FOR UPDATE TO public USING (bucket_id = 'engenharia') WITH CHECK (bucket_id = 'engenharia');
CREATE POLICY eng_obj_delete ON storage.objects FOR DELETE TO public USING (bucket_id = 'engenharia');
