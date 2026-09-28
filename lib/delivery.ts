export const PRODUCTION_BUSINESS_DAYS = 7;

// Nicaragua no usa horario de verano: siempre UTC-6.
const MANAGUA_OFFSET_MS = -6 * 60 * 60 * 1000;

// Fecha estimada en que el pedido está listo: 7 días hábiles (lunes a viernes)
// después de `from`. Devuelve una fecha cuyos campos UTC son la hora de Managua,
// para que el resultado no dependa de la zona horaria del servidor.
// Fecha con la hora de Managua en sus campos UTC.
export function toManagua(d: Date): Date {
  return new Date(d.getTime() + MANAGUA_OFFSET_MS);
}

// "2026-10-07": para comparar días sin importar la hora.
export function managuaDayKey(managuaDate: Date): string {
  return managuaDate.toISOString().slice(0, 10);
}

export function isPastDue(readyDate: Date): boolean {
  return managuaDayKey(readyDate) < managuaDayKey(toManagua(new Date()));
}

export function estimateReadyDate(from: Date = new Date()): Date {
  const d = toManagua(from);
  let added = 0;
  while (added < PRODUCTION_BUSINESS_DAYS) {
    d.setUTCDate(d.getUTCDate() + 1);
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}

export function formatReadyDate(d: Date): string {
  return d.toLocaleDateString("es-NI", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

export function formatShortDate(d: Date): string {
  return d.toLocaleDateString("es-NI", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}
