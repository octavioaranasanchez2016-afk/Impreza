import { NextResponse } from "next/server";
import { claimOrder, sessionEmail } from "@/lib/accounts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Guarda en la cuenta un pedido que se hizo sin correo.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: "Entra a tu cuenta." }, { status: 401 });
  const ok = await claimOrder(id.toLowerCase(), email);
  if (!ok) return NextResponse.json({ error: "Este pedido ya tiene un correo." }, { status: 409 });
  return NextResponse.json({ ok: true });
}
