import { NextResponse } from "next/server";
import { accountData, sessionEmail } from "@/lib/accounts";

export const dynamic = "force-dynamic";

// "Mi cuenta": los pedidos hechos con el correo de la sesión.
export async function GET() {
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: "Entra a tu cuenta." }, { status: 401 });
  return NextResponse.json(await accountData(email));
}
