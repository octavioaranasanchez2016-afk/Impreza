import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendAdminTestEmail } from "@/lib/email";

// Envía un correo de prueba al correo de avisos del admin y explica si algo falla.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, message: "No autenticado." }, { status: 401 });
  }
  return NextResponse.json(await sendAdminTestEmail());
}
