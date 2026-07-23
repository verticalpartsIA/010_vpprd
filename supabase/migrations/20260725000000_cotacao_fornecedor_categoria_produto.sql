-- Categoria de produto — hoje só "elevador" (Glarie) está implementado, mas
-- os próximos fornecedores (escada rolante, esteira rolante, quadro de
-- comando, porta, cabine) vão continuar no MESMO sistema de cotação a
-- fornecedor (não é um domínio separado como o Pedido a Fornecedor de
-- peças) — só muda a categoria e, no futuro, o formulário técnico de cada
-- categoria. Isso prepara o terreno pra seções por fornecedor/produto.
alter table public.cotacoes_elevador_fornecedor
  add column if not exists categoria_produto text not null default 'elevador'
  check (categoria_produto in ('elevador', 'escada_rolante', 'esteira_rolante', 'quadro_comando', 'porta', 'cabine'));
