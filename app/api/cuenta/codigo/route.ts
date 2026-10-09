import { NextRequest, NextResponse } from "next/server";
import { EMAIL_RE, createLoginCode, normalizeEmail } from "@/lib/accounts";
import { HOUR, clientIp, takeLimit } from "@/lib/rate-limit";
import { sendLoginCodeEmail } from "@/lib/email";

// Manda al correo un código para entrar a "Mi cuenta" (la crea si es la primera vez).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = normalizeEmail(typeof body?.email === "string" ? body.email : "");
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return NextResponse.json({ error: "Revisa tu correo: parece incompleto." }, { status: 400 });
  }

  // Límites para que nadie llene el correo de otra persona ni gaste los envíos.
  const ip = clientIp(req.headers);
  try {
    const porConexion = await takeLimit({ clave: `ip:${ip}`, max: 15, windowMs: HOUR });
    const porCorreo =
      porConexion === "ok" ? await takeLimit({ clave: `correo:${email}`, max: 5, windowMs: HOUR, gapMs: 45 * 1000 }) : porConexion;
    if (porCorreo === "espera") {
      return NextResponse.json(
        { error: "Ya te enviamos un código hace un momento. Revisa tu correo (también Spam) o espera un minuto." },
        { status: 429 }
      );
    }
    if (porCorreo === "muchos") {
      return NextResponse.json({ error: "Pediste muchos códigos. Intenta de nuevo en una hora." }, { status: 429 });
    }
  } catch (err) {
    console.error("Cuentas sin activar (falta supabase/seguridad.sql):", err);
    return NextResponse.json(
      { error: "Las cuentas todavía no están activadas. Puedes hacer tu pedido sin cuenta." },
      { status: 503 }
    );
  }

  try {
    const code = await createLoginCode(email);
    const sent = await sendLoginCodeEmail(email, code);
    if (!sent) throw new Error("no se pudo enviar el correo");
  } catch (err) {
    console.error("No se pudo mandar el código para entrar:", err);
    return NextResponse.json({ error: "No pudimos enviarte el código. Intenta de nuevo en un momento." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
