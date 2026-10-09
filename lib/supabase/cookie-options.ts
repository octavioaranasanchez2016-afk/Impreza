// Las cookies de la sesión (admin y cuentas de clientes) solo las lee el servidor
// (httpOnly): aunque alguien lograra meter un script en la página, no podría robarlas.
// En producción viajan solo por https. Las abren y cierran las rutas /api (entrar,
// código, salir) y proxy.ts las renueva.
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// Aviso para las páginas de que hay una cuenta abierta (no es la sesión, no sirve para
// entrar): la sesión real va en cookies que el navegador no puede leer.
export const ACCOUNT_FLAG_COOKIE = "impreza-cuenta";

// La sesión de Supabase va en "sb-<proyecto>-auth-token" (a veces partida en .0, .1).
export const hasSupabaseSession = (names: string[]) => names.some((n) => /^sb-.+-auth-token(.d+)?$/.test(n));
