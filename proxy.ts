import { NextRequest, NextResponse } from "next/server";

// Las acciones del sitio (hacer un pedido, cambiar un estado en el panel, entrar a la
// cuenta) solo se aceptan desde páginas de este mismo sitio. Si otra página web intenta
// mandarlas a nombre de alguien que tiene la sesión abierta, se rechazan.
// Las llamadas de servidor a servidor (sin "Origin") siguen pasando.
export function proxy(req: NextRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return NextResponse.next();

  const origin = req.headers.get("origin");
  const fetchSite = req.headers.get("sec-fetch-site");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  let sameSite = true;
  if (origin) {
    try {
      sameSite = new URL(origin).host === host;
    } catch {
      sameSite = false; // "null" u otra cosa rara
    }
  }
  if (!sameSite || fetchSite === "cross-site") {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
