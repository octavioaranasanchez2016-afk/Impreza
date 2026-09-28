-- Entrega a domicilio o recoger en el taller. Ejecutar una vez en el SQL editor de Supabase.
-- Guarda { metodo: "retiro" | "domicilio", municipio, barrio, direccion, recibe, lat, lng }.
alter table orders add column if not exists entrega jsonb;
