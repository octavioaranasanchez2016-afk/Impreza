-- Seguridad de Impreza. Ejecutar en el SQL editor de Supabase (proyecto Impreza).
-- Se puede correr más de una vez sin problema.

-- 1. Límites contra abuso: cuántos códigos de entrada, pedidos o listas se han pedido,
--    por correo o por conexión. Así nadie puede llenarle el correo a otra persona ni
--    mandar pedidos falsos en masa. Solo la usa el servidor.
create table if not exists limites (
  clave text primary key,          -- "correo:...", "ip:...", "pedido-ip:..."
  enviados integer not null default 0,
  ventana_at timestamptz not null default now(),
  ultimo_at timestamptz not null default now()
);

alter table limites enable row level security;
-- Sin policies: nadie la lee ni la cambia desde el navegador.

-- 2. Lo que se puede subir a los archivos privados: solo fotos y con tamaño máximo,
--    igual que lo que ya revisa la página. Sin esto, alguien podría llenar el
--    almacenamiento con archivos enormes o de otro tipo.
update storage.buckets
  set file_size_limit = 26214400,                 -- 25 MB
      allowed_mime_types = array['image/jpeg']
  where id = 'disenos';

update storage.buckets
  set file_size_limit = 10485760,                 -- 10 MB
      allowed_mime_types = array['image/jpeg', 'image/png']
  where id = 'comprobantes';
