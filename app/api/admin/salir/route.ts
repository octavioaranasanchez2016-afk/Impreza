import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Cerrar la sesión del panel (borra las cookies).
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
