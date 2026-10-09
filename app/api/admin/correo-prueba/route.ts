import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sendAdminTestEmail } from "@/lib/email";

// Envía un correo de prueba al correo de avisos del admin y explica si algo falla.
export async function POST() {
  const auth = await requireAdmin();
  if (auth.denied) return NextResponse.json({ ok: false, message: "Solo para el admin." }, { status: auth.denied.status });
  return NextResponse.json(await sendAdminTestEmail());
}
