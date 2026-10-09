import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SESSION_COOKIE_OPTIONS } from "./cookie-options";

// Cliente para Server Components / Route Handlers, atado a la sesión del
// usuario vía cookies. Respeta Row Level Security igual que el cliente browser.
// cookies() es asíncrono desde Next 15+, así que este helper también lo es.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: SESSION_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // set() llamado desde un Server Component sin permiso de escritura
          // de cookies — se ignora porque la sesión se refresca en proxy.ts.
        }
      },
    },
  });
}

// Cliente con permisos de servicio (bypassa RLS). Solo para operaciones de
// servidor que el admin autenticado dispara (ver diseños privados, cambiar
// estado de pedidos). NUNCA importar este archivo desde un componente cliente
// ("server-only" hace que la compilación falle si pasa).
export function createServiceClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
