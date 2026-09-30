// Cómo recibe el cliente su pedido. Se guarda en orders.entrega (jsonb).
export type ShippingMethod = "retiro" | "domicilio";

export interface ShippingInfo {
  metodo: ShippingMethod;
  municipio?: string;
  barrio?: string;
  // Señas al estilo de Managua: "De la rotonda Rubén Darío 2 c. al sur, casa esquinera".
  direccion?: string;
  recibe?: string; // quién recibe, si no es el cliente
  lat?: number;
  lng?: number;
  envio?: DeliveryQuote; // lo calcula el servidor al guardar el pedido
}

// De aquí sale el delivery. Coordenadas del Plus Code 4PCW+PM5, Managua.
export const WORKSHOP = {
  name: "Arango Textil, Managua",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=4PCW%2BPM5+Managua",
  hours: "Lun – Vie 8am – 5pm · Sáb 8am – 12pm",
  lat: 12.121762,
  lng: -86.253266,
};

// Tarifa del delivery en córdobas: base + cada kilómetro desde Arango Textil,
// redondeado a C$5, con un mínimo. Cambia estos números para ajustar el precio.
export const DELIVERY_RATE = { base: 40, perKm: 15, minimum: 80 };

// Las calles no van en línea recta: la distancia en carretera es ~35% mayor.
const ROAD_FACTOR = 1.35;

// Kilómetros típicos por carretera desde Arango Textil cuando el cliente no comparte
// su ubicación. Con la ubicación GPS se calcula la distancia exacta.
const MUNICIPIO_KM: Record<string, number> = {
  Managua: 7,
  "Ciudad Sandino": 14,
  Tipitapa: 22,
  Ticuantepe: 16,
  Nindirí: 24,
  Masaya: 29,
  "El Crucero": 22,
};

export interface DeliveryQuote {
  km: number;
  costo: number; // córdobas
  exacto: boolean; // true: con la ubicación GPS del cliente; false: estimado por municipio
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function deliveryFee(km: number): number {
  const raw = DELIVERY_RATE.base + DELIVERY_RATE.perKm * km;
  return Math.max(DELIVERY_RATE.minimum, Math.ceil(raw / 5) * 5);
}

// Costo del delivery a esta dirección, o null si todavía no se puede calcular
// (fuera de los municipios de la lista y sin ubicación GPS).
export function deliveryQuote(info: ShippingInfo | null): DeliveryQuote | null {
  if (!info || info.metodo !== "domicilio") return null;
  let km: number;
  let exacto = false;
  if (hasGps(info)) {
    km = distanceKm(WORKSHOP, info) * ROAD_FACTOR;
    exacto = true;
  } else if (info.municipio && MUNICIPIO_KM[info.municipio] !== undefined) {
    km = MUNICIPIO_KM[info.municipio];
  } else {
    return null;
  }
  km = Math.round(km * 10) / 10;
  return { km, costo: deliveryFee(km), exacto };
}

export const OTHER_MUNICIPIO = "Otro lugar de Nicaragua";

export const MUNICIPIOS = [
  "Managua",
  "Ciudad Sandino",
  "Tipitapa",
  "Ticuantepe",
  "Nindirí",
  "Masaya",
  "El Crucero",
  OTHER_MUNICIPIO,
];

export const SHIPPING_COST_NOTE = `El delivery sale de Arango Textil: C$${DELIVERY_RATE.base} + C$${DELIVERY_RATE.perKm} por kilómetro (mínimo C$${DELIVERY_RATE.minimum}).`;

const MIN_DIRECCION_LENGTH = 10;

// Lo que le falta a una dirección a domicilio para poder entregarla, o null.
export function missingAddressField(info: ShippingInfo): string | null {
  if (info.metodo !== "domicilio") return null;
  if (!info.municipio?.trim()) return "el municipio de entrega";
  if ((info.barrio?.trim().length ?? 0) < 2) return "el barrio de entrega";
  if ((info.direccion?.trim().length ?? 0) < MIN_DIRECCION_LENGTH) return "tu dirección con señas";
  // Fuera de los municipios de la lista, el envío se calcula con la ubicación.
  if (!deliveryQuote(info)) return "compartir tu ubicación para calcular el envío";
  return null;
}

// Nicaragua completa, con margen: descarta coordenadas absurdas.
function inNicaragua(lat: number, lng: number) {
  return lat > 10.5 && lat < 15.3 && lng > -88 && lng < -82.5;
}

function cleanText(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.replace(/\s+/g, " ").trim().slice(0, max);
  return text || undefined;
}

// Limpia lo que manda el navegador (o lo que viene de la base de datos).
// Devuelve null si no hay un método de entrega válido.
export function parseShipping(raw: unknown): ShippingInfo | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.metodo === "retiro") return { metodo: "retiro" };
  if (r.metodo !== "domicilio") return null;

  const info: ShippingInfo = {
    metodo: "domicilio",
    municipio: cleanText(r.municipio, 60),
    barrio: cleanText(r.barrio, 120),
    direccion: cleanText(r.direccion, 400),
    recibe: cleanText(r.recibe, 120),
  };
  const lat = Number(r.lat);
  const lng = Number(r.lng);
  if (r.lat != null && r.lng != null && Number.isFinite(lat) && Number.isFinite(lng) && inNicaragua(lat, lng)) {
    info.lat = Math.round(lat * 1e6) / 1e6;
    info.lng = Math.round(lng * 1e6) / 1e6;
  }
  // El costo guardado del pedido (el servidor siempre lo vuelve a calcular al crearlo).
  const envio = r.envio as Record<string, unknown> | undefined;
  if (envio && Number.isFinite(Number(envio.costo)) && Number.isFinite(Number(envio.km))) {
    info.envio = { km: Number(envio.km), costo: Number(envio.costo), exacto: Boolean(envio.exacto) };
  }
  return info;
}

export function hasGps(info: ShippingInfo): info is ShippingInfo & { lat: number; lng: number } {
  return typeof info.lat === "number" && typeof info.lng === "number";
}

// Con GPS abre el punto exacto; si no, busca la dirección escrita.
export function addressMapsUrl(info: ShippingInfo): string {
  const query = hasGps(info)
    ? `${info.lat},${info.lng}`
    : [info.direccion, areaLabel(info), "Nicaragua"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

// "Bolonia, Managua". Con "otro lugar" el barrio ya trae la ciudad.
export function areaLabel(info: ShippingInfo): string {
  const municipio = info.municipio === OTHER_MUNICIPIO ? undefined : info.municipio;
  return [info.barrio, municipio].filter(Boolean).join(", ");
}

// Una línea para listas y correos.
export function shippingSummary(info: ShippingInfo | null): string {
  if (!info) return "Por coordinar";
  return info.metodo === "retiro" ? "Recoge en el taller" : `A domicilio · ${areaLabel(info)}`;
}

// Texto completo de la dirección, para WhatsApp y notas.
export function addressText(info: ShippingInfo): string {
  if (info.metodo === "retiro") return `Recoge en el taller (${WORKSHOP.name})`;
  return [
    `Entrega a domicilio: ${areaLabel(info)}`,
    info.envio && `Delivery: C$${info.envio.costo} (${info.envio.km} km)`,
    info.direccion && `Señas: ${info.direccion}`,
    info.recibe && `Recibe: ${info.recibe}`,
    hasGps(info) && `Ubicación: ${addressMapsUrl(info)}`,
  ]
    .filter(Boolean)
    .join("\n");
}
