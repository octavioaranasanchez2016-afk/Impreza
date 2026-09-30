-- Técnica de cada pieza: un mismo pedido puede mezclar serigrafía, sublimado, DTF y bordado.
-- Correr una vez en Supabase → SQL Editor. Mientras no exista, la técnica de cada pieza
-- se anota en las notas del pedido.
alter table order_items add column if not exists tecnica text;
