import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ACCOUNT_FLAG_COOKIE } from "@/lib/supabase/cookie-options";

// Cierra la sesión de "Mi cuenta" (borra las cookies).
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ACCOUNT_FLAG_COOKIE);
  return res;
}
