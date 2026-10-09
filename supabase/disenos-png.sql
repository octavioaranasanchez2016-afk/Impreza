-- Diseños en PNG: las imágenes con forma o con el fondo quitado llevan transparencia,
-- y el JPG no la guarda. Ejecutar en el SQL editor de Supabase (proyecto Impreza).
-- Se puede correr más de una vez sin problema.
update storage.buckets
  set allowed_mime_types = array['image/jpeg', 'image/png']
  where id = 'disenos';
