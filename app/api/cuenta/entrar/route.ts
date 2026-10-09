import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EMAIL_RE, normalizeEmail } from "@/lib/accounts";
import { HOUR, clientIp, takeLimit } from "@/lib/rate-limit";

// Revisa el código del correo y abre la sesión (queda en las cookies). Los intentos se
// limitan aquí: Supabase ve todas las verificaciones como si vinieran del servidor.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = normalizeEmail(typeof body?.email === "string" ? body.email : "");
  const code = typeof body?.code === "string" ? body.code.replace(/\D/g, "") : "";
  if (!EMAIL_RE.test(email) || code.length < 6 || code.length > 10) {
    return NextResponse.json({ error: "Escribe el código de 6 números que te llegó al correo." }, { status: 400 });
  }

  const ip = clientIp(req.headers);
  try {
    const porCorreo = await takeLimit({ clave: `intento:${email}`, max: 6, windowMs: 15 * 60 * 1000 });
    const porConexion = porCorreo === "ok" ? await takeLimit({ clave: `intento-ip:${ip}`, max: 30, windowMs: HOUR }) : porCorreo;
    if (porConexion !== "ok") {
      return NextResponse.json(
        { error: "Demasiados intentos. Espera unos minutos y pide un código nuevo." },
        { status: 429 }
      );
    }
  } catch (err) {
    console.error("Cuentas sin activar (falta supabase/seguridad.sql):", err);
    return NextResponse.json({ error: "Las cuentas todavía no están activadas." }, { status: 503 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
  if (error) {
    return NextResponse.json(
      { error: "Ese código no sirve: revisa los números o pide uno nuevo (cada código vale una hora y una sola vez)." },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
