-- Verificación en dos pasos del panel, también en la base de datos: los pedidos, las
-- reseñas y los archivos privados solo se leen o cambian con una sesión que ya puso el
-- código del celular ("aal2"). Con solo la contraseña no se ve nada, ni entrando directo
-- a Supabase con la llave pública.
--
-- IMPORTANTE: correrlo DESPUÉS de configurar el código en el panel (la primera vez que
-- entras te lo pide). Ejecutar en el SQL editor de Supabase (proyecto Impreza).

create or replace function public.es_admin_verificado() returns boolean
  language sql stable security definer set search_path = public
as $$
  select exists (select 1 from admins where id = auth.uid())
     and coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

alter policy "admins leen pedidos" on orders using (es_admin_verificado());
alter policy "admins actualizan pedidos" on orders using (es_admin_verificado());
alter policy "admins leen items" on order_items using (es_admin_verificado());
alter policy "admins leen transacciones" on payment_transactions using (es_admin_verificado());
alter policy "admins leen resenas" on resenas using (es_admin_verificado());
alter policy "admins actualizan resenas" on resenas using (es_admin_verificado());
alter policy "admins borran resenas" on resenas using (es_admin_verificado());
alter policy "admins leen disenos" on storage.objects using (bucket_id = 'disenos' and es_admin_verificado());
alter policy "admins leen comprobantes" on storage.objects using (bucket_id = 'comprobantes' and es_admin_verificado());

-- Si pierdes el celular y no guardaste la clave: cambia TU-CORREO por tu correo del panel
-- y corre solo esta línea (sin los dos guiones). Al entrar al panel te pedirá
-- configurar el código otra vez.
-- delete from auth.mfa_factors where user_id = (select id from auth.users where email = 'TU-CORREO');
