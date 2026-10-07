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
  order_id uuid references orders(id) on delete set null,  -- el pedido que se hizo con esta lista
  created_at timestamptz not null default now()
);

-- Por si la tabla ya existía de un intento anterior sin esta columna.
alter table listas_tallas add column if not exists order_id uuid references orders(id) on delete set null;

create index if not exists listas_tallas_order_idx on listas_tallas (order_id);

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

-- Camisas con el nombre de cada persona (2026-10-06): el organizador elige qué va en
-- cada lugar (estilo.lugares, ej. {"espalda":"ambos","manga-izq":"numero"}), de ahí
-- sale lo que cada persona escribe (personalizado: nombre, numero o nombre_numero), y
-- el diseñador guarda además la letra y el color (estilo.fuente, estilo.color).
alter table listas_tallas add column if not exists personalizado text not null default 'ninguno';
alter table listas_tallas add column if not exists estilo jsonb;
alter table listas_tallas_personas add column if not exists texto text;
alter table listas_tallas_personas add column if not exists numero text;

-- Si el organizador deja que cada quien elija la letra o el color de su nombre
-- (estilo.eligen de la lista), lo que eligió cada persona (2026-10-07).
alter table listas_tallas_personas add column if not exists estilo jsonb;

-- Que Supabase vea las tablas nuevas de inmediato.
notify pgrst, 'reload schema';
