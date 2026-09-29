// Datos para la factura con RUC que piden las empresas. Se guarda en orders.factura (jsonb).
export interface BillingInfo {
  razonSocial: string;
  ruc: string;
}

// El RUC nicaragüense tiene 14 caracteres (p. ej. J0310000000000 para empresas,
// o la cédula con su letra para personas). Se acepta con o sin guiones y espacios.
export function normalizeRuc(value: string): string {
  return value.toUpperCase().replace(/[\s-]/g, "");
}

export function isValidRuc(value: string): boolean {
  return /^[A-Z0-9]{10,20}$/.test(normalizeRuc(value));
}

// Lo que le falta a la factura con RUC, o null si está completa.
export function missingBillingField(b: BillingInfo): string | null {
  if (b.razonSocial.trim().length < 2) return "el nombre o razón social para la factura";
  if (!isValidRuc(b.ruc)) return "un número RUC válido";
  return null;
}

// Limpia lo que manda el navegador (o lo que viene de la base de datos).
export function parseBilling(raw: unknown): BillingInfo | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const razonSocial = typeof r.razonSocial === "string" ? r.razonSocial.replace(/\s+/g, " ").trim().slice(0, 120) : "";
  const ruc = typeof r.ruc === "string" ? normalizeRuc(r.ruc).slice(0, 20) : "";
  if (!razonSocial || !ruc) return null;
  return { razonSocial, ruc };
}

export function billingText(b: BillingInfo): string {
  return `Factura con RUC: ${b.razonSocial} · RUC ${b.ruc}`;
}
