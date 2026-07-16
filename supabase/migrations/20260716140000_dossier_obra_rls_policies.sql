-- ============================================================
-- Corrige RLS das tabelas dossier_* — RLS estava habilitado desde
-- 20260619000000_dossier_obra.sql mas sem NENHUMA policy criada,
-- o que bloqueia silenciosamente toda leitura/escrita via anon key
-- (mesmo padrão de policies já usado em embarques/tarefas).
-- ============================================================

CREATE POLICY leitura_publica ON public.dossier_obra FOR SELECT TO public USING (true);
CREATE POLICY escrita_anon    ON public.dossier_obra FOR INSERT TO public WITH CHECK (true);
CREATE POLICY update_anon     ON public.dossier_obra FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY leitura_publica ON public.dossier_history FOR SELECT TO public USING (true);
CREATE POLICY escrita_anon    ON public.dossier_history FOR INSERT TO public WITH CHECK (true);

CREATE POLICY leitura_publica ON public.dossier_responsaveis FOR SELECT TO public USING (true);
CREATE POLICY escrita_anon    ON public.dossier_responsaveis FOR INSERT TO public WITH CHECK (true);
CREATE POLICY update_anon     ON public.dossier_responsaveis FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY leitura_publica ON public.dossier_pendencias FOR SELECT TO public USING (true);
CREATE POLICY escrita_anon    ON public.dossier_pendencias FOR INSERT TO public WITH CHECK (true);
CREATE POLICY update_anon     ON public.dossier_pendencias FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY leitura_publica ON public.dossier_documentos FOR SELECT TO public USING (true);
CREATE POLICY escrita_anon    ON public.dossier_documentos FOR INSERT TO public WITH CHECK (true);
CREATE POLICY update_anon     ON public.dossier_documentos FOR UPDATE TO public USING (true) WITH CHECK (true);
