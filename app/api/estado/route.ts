import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Diagnóstico público: dice SI están configuradas las variables del correo en el
// servidor, nunca sus valores. Sirve para revisar los avisos de pedidos nuevos.
export function GET() {
  return NextResponse.json({
    correo: {
      claveResend: Boolean(process.env.RESEND_API_KEY),
      correoDeAvisos: Boolean(process.env.ADMIN_NOTIFICATION_EMAIL),
      remitentePropio: Boolean(process.env.EMAIL_FROM),
    },
  });
}
