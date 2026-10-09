// Cuentas de clientes (opcionales). Se entra con un código de 6 dígitos que llega al
// correo; no hay contraseñas. La cuenta ve todos los pedidos hechos con ese correo,
// también los de antes de tener cuenta. Pedir sin cuenta sigue igual.
//
// El código lo genera Supabase (vence y sirve una sola vez) y lo mandamos nosotros
// con Resend, desde el mismo correo de los pedidos. Solo para el servidor.

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getProductById } from "@/lib/catalog";
import { OrderStatus, PaymentStatus } from "@/lib/types";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

// El correo de quien tiene la sesión abierta (verificada con Supabase), o null.
export async function sessionEmail(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ? normalizeEmail(user.email) : null;
}

// Para buscar el correo tal cual con ilike (sin que _ o % hagan de comodín).
const exactLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);

// Crea la cuenta si no existe y genera un código nuevo para entrar.
export async function createLoginCode(email: string): Promise<string> {
  const admin = createServiceClient().auth.admin;
  const created = await admin.createUser({ email, email_confirm: true });
  // Si ya tiene cuenta, Supabase responde que el correo ya existe: está bien.
  if (created.error && created.error.code !== "email_exists" && created.error.status !== 422) {
    throw new Error(`createUser: ${created.error.message}`);
  }
  const { data, error } = await admin.generateLink({ type: "magiclink", email });
  const code = data?.properties?.email_otp;
  if (error || !code) throw new Error(`generateLink: ${error?.message ?? "sin código"}`);
  return code;
}

export interface AccountOrder {
  id: string;
  codigo: string;
  fecha: string;
  status: OrderStatus;
  pago: PaymentStatus;
  total: number;
  piezas: number;
  resumen: string; // "Camisa básica, Gorra"
}

export interface AccountData {
  email: string;
  perfil: { nombre: string; telefono: string } | null; // de su último pedido
  pedidos: AccountOrder[];
}

// Los pedidos hechos con ese correo, del más nuevo al más viejo (sin los descartados).
export async function accountData(email: string): Promise<AccountData> {
  const supabase = createServiceClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .ilike("cliente_email", exactLike(email))
    .order("created_at", { ascending: false })
    .limit(60);
  const visible = (orders ?? []).filter((o) => o.descartado !== true);
  const ids = visible.map((o) => o.id as string);
  const { data: items } = ids.length
    ? await supabase.from("order_items").select("order_id, product_id, cantidad").in("order_id", ids)
    : { data: [] };

  const pedidos = visible.map((o) => {
    const mine = (items ?? []).filter((i) => i.order_id === o.id);
    const names = [...new Set(mine.map((i) => getProductById(i.product_id)?.name ?? i.product_id))];
    return {
      id: o.id,
      codigo: String(o.id).slice(0, 8).toUpperCase(),
      fecha: o.created_at,
      status: o.status,
      pago: o.payment_status,
      total: Number(o.total),
      piezas: mine.reduce((sum, i) => sum + Number(i.cantidad), 0),
      resumen: names.join(", "),
    };
  });
  const latest = visible[0];
  return {
    email,
    perfil: latest ? { nombre: latest.cliente_nombre, telefono: latest.cliente_telefono } : null,
    pedidos,
  };
}

// Un pedido que se hizo sin correo pasa a la cuenta (y desde ahí le llegan los avisos).
// Solo si no tiene correo: no se le quita el pedido a nadie.
export async function claimOrder(orderId: string, email: string): Promise<boolean> {
  const { data } = await createServiceClient()
    .from("orders")
    .update({ cliente_email: email })
    .eq("id", orderId)
    .is("cliente_email", null)
    .select("id");
  return Boolean(data?.length);
}
