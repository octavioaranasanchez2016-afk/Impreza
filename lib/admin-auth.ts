import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Los clientes también pueden tener cuenta (para ver sus pedidos), así que estar
// conectado no basta: el panel y sus rutas son solo para quien está en la tabla admins.
// Devuelve el cliente de Supabase con la sesión del admin, o la respuesta de error.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { denied: NextResponse.json({ error: "No autenticado." }, { status: 401 }) };
  const { data: admin } = await supabase.from("admins").select("id").eq("id", user.id).single();
  if (!admin) return { denied: NextResponse.json({ error: "Sin acceso." }, { status: 403 }) };
  return { supabase, user };
}
