-- Cuentas de clientes (opcionales): entran con un código que les llega al correo y
-- ven todos los pedidos hechos con ese correo. Ejecutar en el SQL editor de Supabase.

-- Cuántos códigos se han pedido, por correo y por conexión, para que nadie pueda
-- llenarle el correo a otra persona ni gastar los envíos. Solo la usa el servidor.
create table if not exists cuenta_limites (
  clave text primary key,          -- "correo:..." o "ip:..."
  enviados integer not null default 0,
  ventana_at timestamptz not null default now(),
  ultimo_at timestamptz not null default now()
);

alter table cuenta_limites enable row level security;
-- Sin policies: nadie la lee desde el navegador.
