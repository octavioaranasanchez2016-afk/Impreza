import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Cierra la sesión de "Mi cuenta" (borra las cookies).
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
