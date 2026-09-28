// Los precios del taller se definen en córdobas (NIO) y se muestran también en dólares.

// Tipo de cambio oficial del Banco Central de Nicaragua (C$ por US$1).
// Si cambia, basta con actualizar este número.
export const CORDOBAS_PER_DOLLAR = 36.6243;

export function formatCordobas(amount: number): string {
  return `C$${amount.toLocaleString("es-NI", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function cordobasToDollars(cordobas: number): number {
  return Math.round((cordobas / CORDOBAS_PER_DOLLAR) * 100) / 100;
}

export function formatInDollars(cordobas: number): string {
  return `US$${cordobasToDollars(cordobas).toLocaleString("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatBoth(cordobas: number): string {
  return `${formatCordobas(cordobas)} (${formatInDollars(cordobas)})`;
}
