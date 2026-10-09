import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Quién puede usar el panel. Los clientes también pueden tener cuenta (para ver sus
// pedidos), así que estar conectado no basta: hay que estar en la tabla admins y haber
// puesto el código del celular (verificación en dos pasos: sesión "aal2"). Con solo la
// contraseña no se entra.
async function checkAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, problem: "sin-sesion" as const };
  const { data: admin } = await supabase.from("admins").select("nombre").eq("id", user.id).maybeSingle();
  if (!admin) return { supabase, problem: "sin-acceso" as const };
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") return { supabase, user, admin, problem: "sin-codigo" as const };
  return { supabase, user, admin: admin as { nombre: string }, problem: null };
}

// Para las rutas /api/admin: devuelve la sesión del admin, o la respuesta de error.
export async function requireAdmin() {
  const check = await checkAdmin();
  if (check.problem === "sin-sesion") return { denied: NextResponse.json({ error: "No autenticado." }, { status: 401 }) };
  if (check.problem === "sin-acceso") return { denied: NextResponse.json({ error: "Sin acceso." }, { status: 403 }) };
  if (check.problem === "sin-codigo") {
    return { denied: NextResponse.json({ error: "Falta el código del celular: vuelve a entrar al panel." }, { status: 403 }) };
  }
  return { supabase: check.supabase, user: check.user };
}

// Para las páginas del panel: si falta algo, lleva a donde se completa. Cada página lo
// revisa además del layout (el layout no siempre se vuelve a ejecutar).
export async function requireAdminPage() {
  const check = await checkAdmin();
  if (check.problem === "sin-sesion") redirect("/admin/login");
  if (check.problem === "sin-acceso") redirect("/admin/login?error=sin_acceso");
  if (check.problem === "sin-codigo") redirect("/admin/verificacion");
  return { supabase: check.supabase, user: check.user, admin: check.admin };
}

// Para la página del código: sesión y admin, sin exigir todavía el código.
export async function adminWithoutCode() {
  const check = await checkAdmin();
  if (check.problem === "sin-sesion") redirect("/admin/login");
  if (check.problem === "sin-acceso") redirect("/admin/login?error=sin_acceso");
  return check;
}
