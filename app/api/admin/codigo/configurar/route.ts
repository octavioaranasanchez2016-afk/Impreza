import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

// La primera vez: prepara la app del celular (código QR y clave de respaldo).
export async function POST() {
  const auth = await requireAdmin({ withoutCode: true });
  if (auth.denied) return auth.denied;
  const { supabase } = auth;

  const { data: list } = await supabase.auth.mfa.listFactors();
  // Ya tiene la app configurada: no se cambia desde aquí (se entra con el código).
  if ((list?.totp ?? []).length > 0) {
    return NextResponse.json({ error: "Tu app ya está configurada: escribe el código." }, { status: 409 });
  }
  // Si quedó una configuración a medias (se cerró la página), se borra para empezar limpia.
  for (const factor of list?.all ?? []) {
    if (factor.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `Impreza ${new Date().toISOString().slice(0, 10)}`,
  });
  if (error || !data) {
    console.error("No se pudo preparar el código del celular:", error);
    return NextResponse.json(
      {
        error:
          error?.code === "mfa_totp_enroll_not_enabled"
            ? "En Supabase falta activar la app de autenticación: Authentication → Multi-Factor → TOTP (App Authenticator) → Enabled."
            : "No se pudo preparar el código. Recarga la página.",
      },
      { status: 500 }
    );
  }
  return NextResponse.json({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
}
