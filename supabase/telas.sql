-- Tela de cada pieza (piloto de telas en la camisa básica).
-- Correr una vez en Supabase → SQL Editor cuando se publique la opción de telas.
-- Mientras no exista, los pedidos guardan la tela en las notas del pedido.
alter table order_items add column if not exists tela text;
