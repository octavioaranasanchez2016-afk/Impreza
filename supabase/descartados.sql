-- Pedidos descartados (de prueba, falsos, duplicados o cancelados). Ejecutar una vez
-- en el SQL editor de Supabase. Un pedido descartado sale de la lista de activos y no
-- cuenta en la facturación del panel; se puede restaurar.
alter table orders add column if not exists descartado boolean not null default false;
