// Del lado del navegador: ¿hay una cuenta abierta? La sesión va en cookies que el
// navegador no puede leer; al entrar, el servidor deja además el aviso "impreza-cuenta".
// Revisarlo no cuesta nada; solo si está se le pregunta al servidor por la cuenta.
import type { AccountData } from "./accounts";
import { ACCOUNT_FLAG_COOKIE } from "./supabase/cookie-options";

export type { AccountData, AccountOrder } from "./accounts";

export function hasSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  // Las sesiones de antes de este cambio todavía se ven como "sb-...-auth-token".
  return document.cookie
    .split(/;\s*/)
    .some((c) => c === `${ACCOUNT_FLAG_COOKIE}=1` || /^sb-[^=]+-auth-token(\.\d+)?=/.test(c));
}

// La cuenta abierta, o null si no hay sesión (o ya venció).
export async function fetchAccount(): Promise<AccountData | null> {
  if (!hasSessionCookie()) return null;
  try {
    const res = await fetch("/api/cuenta/pedidos", { cache: "no-store" });
    // La sesión ya venció: se quita el aviso para no volver a preguntar.
    if (res.status === 401) document.cookie = `${ACCOUNT_FLAG_COOKIE}=; path=/; max-age=0`;
    return res.ok ? ((await res.json()) as AccountData) : null;
  } catch {
    return null;
  }
}

// A dónde volver después de entrar: solo rutas de este sitio.
export function safeReturnPath(value: string | null | undefined): string | null {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : null;
}
