-- Esquema inicial de Impreza. Ejecutar en el SQL editor de Supabase.

create extension if not exists "uuid-ossp";

create type order_status as enum ('recibido', 'diseno_aprobado', 'en_produccion', 'listo_entregado');
create type payment_method as enum ('contra_entrega', 'transferencia', 'whatsapp', 'en_linea');
create type payment_status as enum ('pendiente', 'en_revision', 'pagado', 'fallido');
create type technique as enum ('serigrafia', 'sublimado', 'bordado');

create table admins (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default uuid_generate_v4(),
  cliente_nombre text not null,
  cliente_telefono text not null,
  cliente_email text,
  tecnica technique not null,
  -- Uno o más diseños, uno por zona (frente/espalda/manga). Cada entrada:
  -- { zona, tipo: "imagen"|"texto", path? (storage, para imagen),
  --   texto?, color?, fuente? (para texto), posX, posY, escala, rotacion }.
  -- La zona "frente" siempre está presente — es la única obligatoria.
  disenos jsonb not null default '[]'::jsonb,
  notas text,
  -- { metodo: "retiro" | "domicilio", municipio, barrio, direccion, recibe, lat, lng }
  entrega jsonb,
  -- Fecha en que el admin archivó el pedido completado; null = activo.
  archivado_at timestamptz,
  -- { razonSocial, ruc } cuando el cliente pide factura con RUC; null si no.
  factura jsonb,
  status order_status not null default 'recibido',
  payment_method payment_method not null,
  payment_status payment_status not null default 'pendiente',
  comprobante_url text,
  subtotal numeric(10, 2) not null,
  descuento_pct numeric(4, 3) not null default 0,
  descuento_monto numeric(10, 2) not null default 0,
  cargo_diseno numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id text not null,
  color text not null,
  talla text not null,
  cantidad integer not null check (cantidad > 0)
);

create table payment_transactions (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  provider text not null,
  status payment_status not null default 'pendiente',
  provider_reference text,
  created_at timestamptz not null default now()
);

create index on order_items (order_id);
create index on payment_transactions (order_id);
create index on orders (status);

-- Row Level Security --------------------------------------------------------

alter table orders enable row level security;
alter table order_items enable row level security;
alter table payment_transactions enable row level security;
alter table admins enable row level security;

-- Los pedidos SIEMPRE se crean desde /api/pedidos usando la service role key
-- (que ignora RLS), nunca directo desde el navegador. Así el total se
-- recalcula en el servidor con lib/pricing.ts y no se puede manipular desde
-- el cliente. Por eso aquí no hay policy de INSERT para "anon".

-- Los admins autenticados pueden leer y actualizar todo.
create policy "admins leen pedidos"
  on orders for select
  to authenticated
  using (exists (select 1 from admins where admins.id = auth.uid()));

create policy "admins actualizan pedidos"
  on orders for update
  to authenticated
  using (exists (select 1 from admins where admins.id = auth.uid()));

create policy "admins leen items"
  on order_items for select
  to authenticated
  using (exists (select 1 from admins where admins.id = auth.uid()));

create policy "admins leen transacciones"
  on payment_transactions for select
  to authenticated
  using (exists (select 1 from admins where admins.id = auth.uid()));

create policy "admins se ven a si mismos"
  on admins for select
  to authenticated
  using (id = auth.uid());

-- Storage ---------------------------------------------------------------
-- Antes de correr lo de abajo, crear en el dashboard de Supabase
-- (Storage > New bucket, marcados como privados):
--   1. bucket "disenos"      — archivos de diseño subidos por clientes
--   2. bucket "comprobantes" — comprobantes de transferencia

create policy "cualquiera puede subir su diseno"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'disenos');

create policy "cualquiera puede subir su comprobante"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'comprobantes');

create policy "admins leen disenos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'disenos'
    and exists (select 1 from admins where admins.id = auth.uid())
  );

create policy "admins leen comprobantes"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'comprobantes'
    and exists (select 1 from admins where admins.id = auth.uid())
  );
