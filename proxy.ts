import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { SESSION_COOKIE_OPTIONS, hasSupabaseSession } from "@/lib/supabase/cookie-options";

// Corre antes de las rutas /api y de las páginas del panel:
// 1. Las acciones (hacer un pedido, cambiar un estado, entrar a la cuenta) solo se
//    aceptan desde páginas de este mismo sitio: si otra página web intenta mandarlas a
//    nombre de alguien con la sesión abierta, se rechazan. Las llamadas de servidor a
//    servidor (sin "Origin") siguen pasando.
// 2. Renueva la sesión (las cookies solo las lee el servidor), para que no se cierre
//    sola cada hora.
export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    let sameSite = true;
    if (origin) {
      try {
        sameSite = new URL(origin).host === host;
      } catch {
        sameSite = false; // "null" u otra cosa rara
      }
    }
    if (!sameSite || req.headers.get("sec-fetch-site") === "cross-site") {
      return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
    }
  }

  // Sin sesión no hay nada que renovar (la mayoría de las visitas).
  if (!hasSupabaseSession(req.cookies.getAll().map((c) => c.name))) return NextResponse.next();

  let response = NextResponse.next({ request: req });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: SESSION_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        response = NextResponse.next({ request: req });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
};
