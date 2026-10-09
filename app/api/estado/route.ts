import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// Diagnóstico para el admin: dice SI están configuradas las variables del correo en el
// servidor, nunca sus valores. Sirve para revisar los avisos de pedidos nuevos.
export async function GET() {
  const auth = await requireAdmin();
  if (auth.denied) return auth.denied;
  return NextResponse.json({
    correo: {
      claveResend: Boolean(process.env.RESEND_API_KEY),
      correoDeAvisos: Boolean(process.env.ADMIN_NOTIFICATION_EMAIL),
      remitentePropio: Boolean(process.env.EMAIL_FROM),
    },
  });
}
