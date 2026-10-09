import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { withinLimit } from "@/lib/rate-limit";

// Revisa el código de 6 números de la app del celular y sube la sesión a "aal2".
export async function POST(req: NextRequest) {
  const auth = await requireAdmin({ withoutCode: true });
  if (auth.denied) return auth.denied;
  const { supabase, user } = auth;

  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.replace(/\D/g, "") : "";
  if (code.length !== 6) return NextResponse.json({ error: "Escribe los 6 números del código." }, { status: 400 });

  // Contra quien prueba códigos al azar: 8 intentos cada 15 minutos.
  if (!(await withinLimit({ clave: `admin-codigo:${user!.id}`, max: 8, windowMs: 15 * 60 * 1000 }))) {
    return NextResponse.json({ error: "Demasiados intentos. Espera 15 minutos." }, { status: 429 });
  }

  // El que está configurando, o el que ya tiene.
  const { data: list } = await supabase.auth.mfa.listFactors();
  const requested = typeof body?.factorId === "string" ? body.factorId : null;
  const factor =
    (requested && list?.all.find((f) => f.id === requested && f.factor_type === "totp")) || list?.totp[0] || null;
  if (!factor) return NextResponse.json({ error: "No encontramos tu app configurada. Recarga la página." }, { status: 409 });

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
  if (error) {
    return NextResponse.json(
      { error: "Ese código no es correcto o ya cambió. Escribe el que aparece ahora en la app." },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
