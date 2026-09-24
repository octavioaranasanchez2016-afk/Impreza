import { createBrowserClient } from "@supabase/ssr";

// Cliente para componentes de cliente ("use client"). Usa la clave anónima,
// segura de exponer al navegador — el acceso real lo controla Row Level
// Security en Supabase.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
