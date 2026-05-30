-- ============================================================
-- Importação · Aduana — DI/DUIMP + status Siscomex
-- (canal de parametrização já existe em embarques.channel)
-- Tela: Logística → Importação → detalhe do embarque (card Aduana)
-- ============================================================

ALTER TABLE public.embarques ADD COLUMN IF NOT EXISTS di_number       text;  -- Nº DI / DUIMP
ALTER TABLE public.embarques ADD COLUMN IF NOT EXISTS di_date         date;  -- data de registro da DI
ALTER TABLE public.embarques ADD COLUMN IF NOT EXISTS siscomex_status text;  -- situação no Siscomex
