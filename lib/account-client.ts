// Del lado del navegador: ¿hay una sesión abierta? Supabase guarda la sesión en una
// cookie "sb-<proyecto>-auth-token" (a veces partida en .0, .1). Revisarla no cuesta
// nada; solo si existe se le pregunta al servidor por la cuenta.
import type { AccountData } from "./accounts";

export type { AccountData, AccountOrder } from "./accounts";

export function hasSessionCookie(): boolean {
  return typeof document !== "undefined" && /(?:^|;\s*)sb-[^=;]+-auth-token(?:\.\d+)?=/.test(document.cookie);
}

// La cuenta abierta, o null si no hay sesión (o ya venció).
export async function fetchAccount(): Promise<AccountData | null> {
  if (!hasSessionCookie()) return null;
  try {
    const res = await fetch("/api/cuenta/pedidos", { cache: "no-store" });
    return res.ok ? ((await res.json()) as AccountData) : null;
  } catch {
    return null;
  }
}

// A dónde volver después de entrar: solo rutas de este sitio.
export function safeReturnPath(value: string | null | undefined): string | null {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : null;
}
