-- Listas de tallas para grupos. Ejecutar una vez en el SQL editor de Supabase.
-- El organizador crea una lista (graduación, equipo, empresa) y comparte el enlace;
-- cada persona se anota con su nombre y su talla. Todo se lee y se escribe desde el
-- servidor (service role): no hay políticas para el navegador.
create table if not exists listas_tallas (
  id uuid primary key default gen_random_uuid(),
  clave text not null,              -- llave secreta del organizador (va en su enlace)
  nombre text not null,             -- "Promoción 2026 — Colegio La Salle"
  organizador text,
  product_id text not null,
  color text,                       -- si el grupo ya eligió color
  cerrada boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists listas_tallas_personas (
  id uuid primary key default gen_random_uuid(),
  lista_id uuid not null references listas_tallas(id) on delete cascade,
  nombre text not null,
  talla text not null,
  cantidad integer not null default 1 check (cantidad between 1 and 20),
  token text not null,              -- para que cada quien pueda quitar su propio registro
  created_at timestamptz not null default now()
);

create index if not exists listas_tallas_personas_lista_idx on listas_tallas_personas (lista_id, created_at);

alter table listas_tallas enable row level security;
alter table listas_tallas_personas enable row level security;

-- Que Supabase vea las tablas nuevas de inmediato.
notify pgrst, 'reload schema';
