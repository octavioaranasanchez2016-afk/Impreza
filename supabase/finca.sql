-- Sistema de la finca: cultivos, ingresos/gastos/pérdidas, inventario y pago a trabajadores.
-- Ejecutar una vez en el SQL editor de Supabase.
-- Solo el servidor (service role) lee y escribe, y solo para un admin con sesión iniciada.
-- RLS queda activado sin políticas, así que nadie desde internet puede ver estas tablas.

create table if not exists finca_cultivos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  area_mz numeric,                       -- manzanas sembradas
  fecha_siembra date,
  estado text not null default 'activo' check (estado in ('activo', 'cosechado')),
  notas text,
  created_at timestamptz not null default now()
);

create table if not exists finca_trabajadores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  pago_dia numeric not null default 0,   -- jornal diario en córdobas
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Ingresos (ventas), gastos y pérdidas. Todos en córdobas.
create table if not exists finca_movimientos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  tipo text not null check (tipo in ('ingreso', 'gasto', 'perdida')),
  categoria text not null,
  descripcion text,
  monto numeric not null check (monto >= 0),
  cultivo_id uuid references finca_cultivos(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists finca_movimientos_fecha_idx on finca_movimientos (fecha desc);

-- Pagos a trabajadores (jornales). Cuentan como gasto de "Mano de obra".
create table if not exists finca_pagos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  trabajador_id uuid not null references finca_trabajadores(id) on delete restrict,
  dias numeric,
  monto numeric not null check (monto >= 0),
  cultivo_id uuid references finca_cultivos(id) on delete set null,
  nota text,
  created_at timestamptz not null default now()
);
create index if not exists finca_pagos_fecha_idx on finca_pagos (fecha desc);

create table if not exists finca_inventario (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null default 'insumo' check (categoria in ('insumo', 'herramienta', 'cosecha', 'otro')),
  unidad text not null default 'unidad',  -- quintal, libra, litro, saco, unidad...
  cantidad numeric not null default 0,
  minimo numeric not null default 0,      -- avisa cuando baja de aquí
  costo_unit numeric not null default 0,  -- costo por unidad, para valorar el inventario y las mermas
  created_at timestamptz not null default now()
);

create table if not exists finca_inventario_mov (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references finca_inventario(id) on delete cascade,
  fecha date not null default current_date,
  tipo text not null check (tipo in ('entrada', 'salida', 'merma')),
  cantidad numeric not null check (cantidad > 0),
  nota text,
  created_at timestamptz not null default now()
);
create index if not exists finca_inventario_mov_item_idx on finca_inventario_mov (item_id, fecha desc);

alter table finca_cultivos enable row level security;
alter table finca_trabajadores enable row level security;
alter table finca_movimientos enable row level security;
alter table finca_pagos enable row level security;
alter table finca_inventario enable row level security;
alter table finca_inventario_mov enable row level security;
