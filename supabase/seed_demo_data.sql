-- ============================================================
-- seed_demo_data.sql — Dados de demonstração do VP PRD
-- ------------------------------------------------------------
-- Projeto Supabase: jxtqwzmpgofwctqajewt
-- Estes dados deixam as telas (Jurídico, Logística/navios, etc.)
-- completas como no protótipo do Claude Designer, mantendo tudo
-- persistente no Supabase real.
--
-- Conforme Workflow.md (seção DADOS DE TESTE): dados fictícios são
-- permitidos desde que exista rotina de limpeza/reset (abaixo).
--
-- Uso (psql ou SQL editor do Supabase):
--   1) Para repovoar o alinhamento de demonstração: rode o bloco SEED.
--   2) Para limpar dados de teste: rode o bloco RESET.
-- ============================================================

-- ============================================================
-- SEED — alinhamento de demonstração
-- ============================================================

-- Contratos (Jurídico): status batendo com KPIs + contagem de redações
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS redacted integer DEFAULT 0;
UPDATE public.contratos SET status='Assinado',              redacted=2, pages=18 WHERE id='CTR-001';
UPDATE public.contratos SET status='Em redação',            redacted=3, pages=24 WHERE id='CTR-002';
UPDATE public.contratos SET status='Aguardando assinatura', redacted=0, pages=14 WHERE id='CTR-003';
UPDATE public.contratos SET status='Em assinatura digital', redacted=4, pages=34 WHERE id='CTR-004';

-- Embarques (Logística/Importação): identificadores, invoice, container,
-- posição/geo, e timeline padrão de 9 fases do workflow de importação.
UPDATE public.embarques SET
  position=0.62,
  imo='9839430', supplier='Tianjin Control Systems Co., Ltd.',
  invoice_number='HSL-2026-0418', invoice_value=128400, invoice_currency='USD',
  container_number='MSCU9382821', seal='SH4471092', freight_condition='FCL',
  di_number=NULL, di_date=NULL, siscomex_status='Aguardando chegada do navio (ETA 02/06)',
  docs = '[{"nome":"BL","pronto":true},{"nome":"Invoice","pronto":true},{"nome":"Packing List","pronto":true},{"nome":"Certificado de Origem","pronto":true},{"nome":"Seguro","pronto":false}]'::jsonb,
  milestones = '[
   {"label":"Produção concluída","date":"2026-04-12","state":"done"},
   {"label":"Embarcado (gate-in / load)","date":"2026-04-18","state":"done"},
   {"label":"Saiu do porto de origem","date":"2026-04-20","state":"done"},
   {"label":"Em trânsito marítimo","date":"—","state":"current","note":"Atraso de ~5 dias vs. ETA original"},
   {"label":"Chegada prevista (ETA)","date":"2026-06-02","state":"future"},
   {"label":"Atracação","date":"—","state":"future"},
   {"label":"Desembaraço aduaneiro","date":"—","state":"future"},
   {"label":"Transporte nacional","date":"—","state":"future"},
   {"label":"Entregue na obra","date":"—","state":"future"}
  ]'::jsonb
WHERE id='EMB-001';

UPDATE public.embarques SET
  position=0.97, lat=-23.00, lng=-44.05, speed=0, heading=0,
  imo='9784271', supplier='Shanghai Vertical Tech Co., Ltd.',
  invoice_number='SVT-2026-0502', invoice_value=246800, invoice_currency='USD',
  container_number='COSU7741200', seal='CN8820133', freight_condition='FCL',
  di_number='26/0884213-7', di_date='2026-06-19', siscomex_status='Conferência física — canal vermelho',
  docs = '[{"nome":"BL","pronto":true},{"nome":"Invoice","pronto":true},{"nome":"Packing List","pronto":true},{"nome":"DI","pronto":true}]'::jsonb,
  milestones = '[
   {"label":"Produção concluída","date":"2026-04-28","state":"done"},
   {"label":"Embarcado (gate-in / load)","date":"2026-05-03","state":"done"},
   {"label":"Saiu do porto de origem","date":"2026-05-05","state":"done"},
   {"label":"Em trânsito marítimo","date":"2026-05-06","state":"done"},
   {"label":"Chegada prevista (ETA)","date":"2026-06-18","state":"done"},
   {"label":"Atracação","date":"2026-06-18","state":"done"},
   {"label":"Desembaraço aduaneiro","date":"—","state":"current","note":"Canal vermelho — inspeção física"},
   {"label":"Transporte nacional","date":"—","state":"future"},
   {"label":"Entregue na obra","date":"—","state":"future"}
  ]'::jsonb
WHERE id='EMB-002';

UPDATE public.embarques SET
  position=0.45,
  imo='9461562', supplier='Hamburg Lift Components GmbH',
  invoice_number='HLC-2026-0429', invoice_value=312500, invoice_currency='USD',
  container_number='HLBU4421098', seal='DE5523088', freight_condition='FCL',
  di_number=NULL, di_date=NULL, siscomex_status='Aguardando chegada do navio (ETA 05/06)',
  docs = '[{"nome":"BL","pronto":true},{"nome":"Invoice","pronto":true},{"nome":"Packing List","pronto":true},{"nome":"Certificado de Origem","pronto":false}]'::jsonb,
  milestones = '[
   {"label":"Produção concluída","date":"2026-04-20","state":"done"},
   {"label":"Embarcado (gate-in / load)","date":"2026-04-26","state":"done"},
   {"label":"Saiu do porto de origem","date":"2026-04-28","state":"done"},
   {"label":"Em trânsito marítimo","date":"—","state":"current"},
   {"label":"Chegada prevista (ETA)","date":"2026-06-05","state":"future"},
   {"label":"Atracação","date":"—","state":"future"},
   {"label":"Desembaraço aduaneiro","date":"—","state":"future"},
   {"label":"Transporte nacional","date":"—","state":"future"},
   {"label":"Entregue na obra","date":"—","state":"future"}
  ]'::jsonb
WHERE id='EMB-003';

-- Baseline AIS: posição/geo inicial + zera última sincronização (Edge Function ais-sync)
UPDATE public.embarques SET position=0.62, lat=-18.3, lng=-38.2, speed=14.2, heading=180, last_ais_sync=NULL WHERE id='EMB-001';
UPDATE public.embarques SET position=0.97, lat=-23.00, lng=-44.05, speed=0,   heading=0,   last_ais_sync=NULL WHERE id='EMB-002';
UPDATE public.embarques SET position=0.45, lat=-22.1, lng=-35.7, speed=16.8, heading=195, last_ais_sync=NULL WHERE id='EMB-003';

-- Usuários: remover entradas fictícias (placeholder e duplicata mal grafada)
DELETE FROM public.usuarios WHERE email='gelsonsimoes@gmail.com' AND name='Fulano de Tal';
DELETE FROM public.usuarios WHERE email='ariliene.avila@verticalparts.com.br';

-- ============================================================
-- Catálogo de Produtos (DUIMP) — operadores estrangeiros + produtos
-- ============================================================
INSERT INTO public.operadores_estrangeiros
  (id, codigo, versao, situacao, cpf_cnpj_raiz, pais, nome, logradouro, cidade, tin, email, codigo_interno, codigo_postal, subdivisao)
VALUES
  ('OE-000001','OPE_1',1,'ativado','54123456','CN','Tianjin Control Systems Co., Ltd.','No. 12 Huanghai Road, TEDA','Tianjin','CN91120116MA05','sales@tjcontrol.cn','FORN-TJ','300457','CN-TJ Tianjin'),
  ('OE-000002','OPE_2',1,'ativado','54123456','CN','Shanghai Vertical Tech Co., Ltd.','888 Jufeng Road, Pudong','Shanghai','CN91310115MA1G','liu.mei@shvtech.cn','FORN-SH','201201','CN-SH Shanghai'),
  ('OE-000003','OPE_3',1,'ativado','54123456','DE','Hamburg Lift Components GmbH','Versmannstrasse 4','Hamburg','DE118 540 401','kontakt@hlc.de','FORN-HH','20457','DE-HH Hamburg')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.catalogo_produtos
  (id, codigo, versao, situacao, cpf_cnpj_raiz, modalidade, ncm, ncm_descricao, denominacao, detalhamento, unidade_medida, codigo_interno, atributos, fabricantes)
VALUES
  ('CP-000001','0000000001',1,'ativado','54123456','IMPORTACAO','84313100',
   'Partes de elevadores, monta-cargas ou escadas rolantes',
   'Porta de pavimento automática Fermator para elevador de passageiros',
   'Porta de pavimento automática, abertura central de duas folhas, vão livre 800 mm, aço inox AISI 304 escovado, acionamento por correia dentada, conforme EN 81-20/50. Marca Fermator.',
   'UNIDADE','VPER-PRT-FER-800-CC',
   '[{"codigo":"ATT_801","nome":"Material predominante","valor":"Aço inoxidável"},{"codigo":"ATT_802","nome":"Aplicação","valor":"Elevador de passageiros"}]'::jsonb,
   '["OPE_1"]'::jsonb),
  ('CP-000002','0000000002',1,'ativado','54123456','IMPORTACAO','84313100',
   'Partes de elevadores, monta-cargas ou escadas rolantes',
   'Botoeira de cabina em aço inox com display LED e braille',
   'Painel de operação de cabina (COP), aço inox escovado, botões antivandalismo em braille, display de posição LED de 7 segmentos, tensão 24 Vcc. Compatível com quadro de comando VVVF.',
   'UNIDADE','VPER-BOT-COP-LED-BR',
   '[{"codigo":"ATT_801","nome":"Material predominante","valor":"Aço inoxidável"}]'::jsonb,
   '["OPE_2"]'::jsonb),
  ('CP-000003','0000000003',1,'rascunho','54123456','IMPORTACAO','84313100',
   'Partes de elevadores, monta-cargas ou escadas rolantes',
   'Pente de alumínio 22 dentes para escada rolante',
   NULL,'UNIDADE','VPER-PNT-AL-22D','[]'::jsonb,'[]'::jsonb),
  ('CP-000004','0000000004',2,'ativado','54123456','IMPORTACAO','85371090',
   'Quadros, painéis e outros suportes com aparelhos de comando, < 1000 V',
   'Quadro de comando com inversor de frequência VVVF para elevador',
   'Quadro de comando microprocessado com inversor de frequência (VVVF) para acionamento de motor de tração, potência até 15 kW, 380 V trifásico, com UCM integrada conforme EN 81-20/50. Marca BST.',
   'UNIDADE','VPER-QDC-VVVF-15KW',
   '[{"codigo":"ATT_550","nome":"Tensão nominal","valor":"380 V"}]'::jsonb,
   '["OPE_2","OPE_1"]'::jsonb),
  ('CP-000005','0000000005',1,'desativado','54123456','IMPORTACAO','84313100',
   'Partes de elevadores, monta-cargas ou escadas rolantes',
   'Escova de segurança em nylon 27 mm para escada rolante',
   'Escova de segurança lateral em nylon, altura 27 mm, fixação em perfil de alumínio. Item descontinuado pelo fabricante.',
   'METRO','VPER-ESS-NY-27MM','[]'::jsonb,'["OPE_3"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RESET — limpeza de dados de teste transacionais
-- (descomente para usar; NÃO apaga colaboradores/usuários reais)
-- ============================================================
-- DELETE FROM public.leads      WHERE id LIKE 'LD-E2E%' OR building ILIKE '%teste e2e%';
-- DELETE FROM public.cotacoes   WHERE id LIKE 'CT-E2E%';
-- DELETE FROM public.embarques  WHERE id LIKE 'EM-E2E%';
-- DELETE FROM public.contratos  WHERE id LIKE 'CO-E2E%';
