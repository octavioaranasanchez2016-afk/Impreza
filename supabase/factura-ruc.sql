-- Factura con RUC para empresas. Ejecutar una vez en el SQL editor de Supabase.
-- Guarda { razonSocial, ruc } cuando el cliente pide factura con RUC.
alter table orders add column if not exists factura jsonb;
