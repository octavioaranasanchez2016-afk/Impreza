# Impreza — sitio de pedidos

Sitio de pedidos para taller de serigrafía/sublimado (Managua, Nicaragua).
Next.js 14 + Supabase (base de datos, autenticación de admins, almacenamiento
de archivos).

## 1. Requisitos

- Node.js 20 LTS
- Una cuenta gratuita en [supabase.com](https://supabase.com)

## 2. Configurar Supabase

1. Crea un proyecto nuevo en Supabase.
2. Ve a **SQL Editor** y ejecuta el contenido de [`supabase/schema.sql`](supabase/schema.sql).
3. Ve a **Storage** y crea dos buckets **privados**: `disenos` y `comprobantes`.
4. Ve a **Authentication → Users → Add user** y crea el primer usuario admin
   (correo + contraseña). Copia su `User UID`.
5. Vuelve al **SQL Editor** y crea la fila de admin:
   ```sql
   insert into admins (id, nombre) values ('<User UID copiado>', 'Nombre del admin');
   ```
   Repite este paso por cada admin adicional que necesites.
6. Ve a **Project Settings → API** y copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (¡nunca la expongas en el navegador!)

## 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Rellena `.env.local` con los valores de Supabase, tu número de WhatsApp
(`NEXT_PUBLIC_WHATSAPP_NUMBER`, formato `505XXXXXXXX`).

## 4. Correr en desarrollo

```bash
npm install
npm run dev
```

Abre http://localhost:3000 — el sitio público — y http://localhost:3000/admin/login
para el panel de administración.

## 5. Estructura del proyecto

```
app/
  (público)          → home, catálogo, producto, pedido, confirmación
  admin/
    login/            → login (fuera de la verificación de sesión)
    (protected)/      → pedidos (lista y detalle) — requiere sesión de admin
  api/
    pedidos/           → crea pedidos (recalcula el precio en el servidor)
    admin/pedidos/.../status → cambia el estado de un pedido
lib/
  pricing.ts           → cálculo de precio + descuentos por volumen
  catalog.ts            → catálogo de productos (edítalo con precios reales)
  payments/              → capa de pagos "enchufable" (ver abajo)
supabase/schema.sql        → esquema completo de base de datos + políticas RLS
```

## 6. Precios y catálogo

Edita [`lib/catalog.ts`](lib/catalog.ts) con los precios reales de cada
producto, y [`lib/pricing.ts`](lib/pricing.ts) para ajustar los descuentos por
volumen o el cargo de preparación de serigrafía.

## 7. Conectar la pasarela de pago de BAC (Fase 2)

Toda la lógica de cobro pasa por `lib/payments/`. Hoy solo existe el
proveedor `manual` (contra entrega / transferencia / WhatsApp). Cuando tengas
la documentación de BAC:

1. Completa `lib/payments/bac.ts` (ya tiene la estructura y los pasos
   comentados).
2. Cambia `PAYMENT_PROVIDER=bac` en las variables de entorno.
3. Nada más en el sitio necesita cambiar — el formulario de pedido, el
   cálculo de precio y el panel de admin ya están desacoplados del método de
   pago.

## 8. Desplegar

- **Sitio:** [Vercel](https://vercel.com) (plan gratuito alcanza para
  empezar). Conecta el repo y agrega las mismas variables de entorno de
  `.env.local` en el dashboard de Vercel.
- **Base de datos / storage:** ya vive en Supabase, no requiere despliegue
  aparte.
