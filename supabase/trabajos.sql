-- Galería "Trabajos recientes". Ejecutar una vez en el SQL editor de Supabase.
-- Crea el bucket público "trabajos": las fotos se suben desde el panel (Trabajos)
-- y se ven en la página de inicio. Solo el servidor sube y borra (service role),
-- así que no hace falta ninguna política extra; cualquiera puede VER las fotos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trabajos', 'trabajos', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
