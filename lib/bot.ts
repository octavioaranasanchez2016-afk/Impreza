import "server-only";
import { NextResponse } from "next/server";

// El campo trampa de los formularios (components/Honeypot.tsx) llegó lleno: lo llenó
// un robot, no una persona.
export function looksLikeBot(body: unknown): boolean {
  const hp = (body as { impreza_hp?: unknown } | null)?.impreza_hp;
  return typeof hp === "string" && hp.trim() !== "";
}

export const botResponse = () => NextResponse.json({ error: "No pudimos procesar el envío." }, { status: 400 });

// Error del servidor sin mostrar detalles internos (nombres de tablas, columnas...): el
// detalle queda en los registros de Vercel.
export function serverError(err: unknown, message = "Algo salió mal. Intenta de nuevo.") {
  console.error(message, err);
  return NextResponse.json({ error: message }, { status: 500 });
}
