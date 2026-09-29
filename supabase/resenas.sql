-- Reseñas de clientes. Ejecutar una vez en el SQL editor de Supabase.
-- Solo se puede dejar una reseña por pedido, y solo cuando el pedido está listo/entregado
-- (lo valida /api/resenas). No se publica nada hasta que el admin la aprueba.
create table if not exists resenas (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid unique references orders(id) on delete set null,
  nombre text not null,
  calificacion integer not null check (calificacion between 1 and 5),
  comentario text not null,
  aprobada boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists resenas_aprobada_idx on resenas (aprobada, created_at desc);

alter table resenas enable row level security;

-- Las reseñas se crean y se leen para el público desde el servidor (service role).
-- Los admins las moderan desde el panel.
create policy "admins leen resenas"
  on resenas for select
  to authenticated
  using (exists (select 1 from admins where admins.id = auth.uid()));

create policy "admins actualizan resenas"
  on resenas for update
  to authenticated
  using (exists (select 1 from admins where admins.id = auth.uid()));

create policy "admins borran resenas"
  on resenas for delete
  to authenticated
  using (exists (select 1 from admins where admins.id = auth.uid()));
