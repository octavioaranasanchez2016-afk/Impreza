-- Archivo de pedidos completados. Ejecutar una vez en el SQL editor de Supabase.
-- archivado_at vacío = pedido activo; con fecha = archivado (ya no sale en la lista principal).
alter table orders add column if not exists archivado_at timestamptz;
