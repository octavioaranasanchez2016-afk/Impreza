// Precios del taller en córdobas nicaragüenses (NIO).
export function formatCordobas(amount: number): string {
  return `C$${amount.toLocaleString("es-NI", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
