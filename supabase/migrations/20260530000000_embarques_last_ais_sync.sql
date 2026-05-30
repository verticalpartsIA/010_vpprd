-- ============================================================
-- Importação · Fase 2 (AIS) — timestamp da última sincronização
-- Alimenta o "atualizado há Xmin" na UI; gravado pela Edge Function ais-sync.
-- ============================================================

ALTER TABLE public.embarques ADD COLUMN IF NOT EXISTS last_ais_sync timestamptz;
