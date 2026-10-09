import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clientIp, withinLimit } from "@/lib/rate-limit";

const QUINCE_MINUTOS = 15 * 60 * 1000;

// Entrar al panel con correo y contraseña (después pide el código del celular). Se hace
// en el servidor para que la sesión quede en cookies que el navegador no puede leer.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || email.length > 200 || !password || password.length > 200) {
    return NextResponse.json({ error: "Escribe tu correo y tu contraseña." }, { status: 400 });
  }

  // Contra quien prueba contraseñas una tras otra: 10 intentos cada 15 minutos.
  const ip = clientIp(req.headers);
  const allowed =
    (await withinLimit({ clave: `admin-ip:${ip}`, max: 10, windowMs: QUINCE_MINUTOS })) &&
    (await withinLimit({ clave: `admin-correo:${email}`, max: 10, windowMs: QUINCE_MINUTOS }));
  if (!allowed) {
    return NextResponse.json({ error: "Demasiados intentos. Espera 15 minutos e intenta de nuevo." }, { status: 429 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 400 });
  }
  // Una cuenta que no es del equipo no se queda con la sesión abierta.
  const { data: admin } = await supabase.from("admins").select("id").eq("id", data.user.id).maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "Esta cuenta no tiene acceso al panel." }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}
