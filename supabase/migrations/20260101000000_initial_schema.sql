-- ============================================================
-- VP Gestão · VerticalParts — Schema inicial
-- Migration gerada em 2026-05-25 (snapshot do estado real)
-- Projeto Supabase: jxtqwzmpgofwctqajewt
-- ============================================================

-- leads
CREATE TABLE IF NOT EXISTS leads (
  id           text PRIMARY KEY,
  date         date,
  building     text,
  contact      text,
  role         text,
  phone        text,
  email        text,
  origin       text,
  status       text,
  value        bigint,
  equip        text,
  owner        text,
  priority     text,
  next_action  text,
  created_at   timestamptz DEFAULT now()
);

-- cotacoes
CREATE TABLE IF NOT EXISTS cotacoes (
  id         text PRIMARY KEY,
  date       date,
  lead_id    text,
  building   text,
  items      integer,
  supplier   text,
  status     text,
  deadline   date,
  total      double precision,
  currency   text DEFAULT 'USD',
  owner      text,
  created_at timestamptz DEFAULT now()
);

-- projetos
CREATE TABLE IF NOT EXISTS projetos (
  id            text PRIMARY KEY,
  name          text,
  client        text,
  start_date    date,
  end_date      date,
  owner         text,
  value         bigint,
  phases        jsonb,
  current_phase text,
  building      text,
  projeto       text,
  responsavel   text,
  visita        date,
  status        text,
  pendencia     text,
  descricao     text,
  laudo         text DEFAULT 'Pendente',
  arquivos      integer DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

-- contratos
CREATE TABLE IF NOT EXISTS contratos (
  id           text PRIMARY KEY,
  project_id   text,
  client       text,
  value        bigint,
  status       text,
  days_pending integer DEFAULT 0,
  pages        integer,
  issued_date  date,
  lawyer       text,
  created_at   timestamptz DEFAULT now()
);

-- embarques
CREATE TABLE IF NOT EXISTS embarques (
  id             text PRIMARY KEY,
  bl             text,
  project_id     text,
  client         text,
  vessel         text,
  line           text,
  containers     integer,
  container_type text,
  origin         text,
  destination    text,
  etd            date,
  eta            date,
  eta_original   date,
  status         text,
  channel        text,
  position       double precision,
  lat            double precision,
  lng            double precision,
  speed          double precision,
  heading        integer,
  docs           jsonb,
  milestones     jsonb,
  created_at     timestamptz DEFAULT now()
);

-- gatilhos
CREATE TABLE IF NOT EXISTS gatilhos (
  id           text PRIMARY KEY,
  project_id   text,
  building     text,
  trigger_name text,
  value        bigint,
  due_date     date,
  days_left    integer,
  status       text,
  reverse_from text,
  chain        jsonb,
  created_at   timestamptz DEFAULT now()
);

-- comissoes
CREATE TABLE IF NOT EXISTS comissoes (
  id             serial PRIMARY KEY,
  vendedor       text,
  role           text,
  projetos_count integer,
  faturado       bigint,
  comissao       bigint,
  pct            double precision,
  status         text,
  periodo        text,
  created_at     timestamptz DEFAULT now()
);

-- tarefas
CREATE TABLE IF NOT EXISTS tarefas (
  id         serial PRIMARY KEY,
  title      text,
  due_time   text,
  priority   text,
  module     text,
  role       text,
  done       boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- alertas
CREATE TABLE IF NOT EXISTS alertas (
  id         text PRIMARY KEY,
  level      text,
  title      text,
  sub        text,
  module     text,
  resolved   boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ncm_solicitacoes
CREATE TABLE IF NOT EXISTS ncm_solicitacoes (
  id           text PRIMARY KEY,
  produto      text,
  ncm          text,
  status       text,
  responsavel  text,
  prazo        date,
  ncm_atual    text,
  ncm_sugerido text,
  solicitante  text,
  descricao    text,
  observacoes  text,
  created_at   timestamptz DEFAULT now()
);

-- estoque
CREATE TABLE IF NOT EXISTS estoque (
  sku        text PRIMARY KEY,
  name       text,
  qty        integer,
  min_qty    integer,
  category   text,
  created_at timestamptz DEFAULT now()
);

-- usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      text NOT NULL,
  role       text,
  last_login timestamptz,
  active     boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- equipes
CREATE TABLE IF NOT EXISTS equipes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text NOT NULL,
  lider      text,
  membros    integer DEFAULT 0,
  ativo      text,
  status     text DEFAULT 'Em base',
  telefone   text,
  created_at timestamptz DEFAULT now()
);

-- colaboradores
CREATE TABLE IF NOT EXISTS colaboradores (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      text NOT NULL,
  department text,
  nivel      text,
  is_active  boolean DEFAULT true,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- RLS: habilitar em todas as tabelas
ALTER TABLE leads              ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotacoes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE projetos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE embarques          ENABLE ROW LEVEL SECURITY;
ALTER TABLE gatilhos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ncm_solicitacoes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque            ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios           ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaboradores      ENABLE ROW LEVEL SECURITY;
