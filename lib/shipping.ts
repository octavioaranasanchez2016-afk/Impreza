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
}

export const WORKSHOP = {
  name: "Arango Textil, Managua",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=4PCW%2BPM5+Managua",
  hours: "Lun – Vie 8am – 5pm · Sáb 8am – 12pm",
};

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

export const SHIPPING_COST_NOTE = "El costo del envío depende de tu zona y te lo confirmamos por WhatsApp.";

const MIN_DIRECCION_LENGTH = 10;

// Lo que le falta a una dirección a domicilio para poder entregarla, o null.
export function missingAddressField(info: ShippingInfo): string | null {
  if (info.metodo !== "domicilio") return null;
  if (!info.municipio?.trim()) return "el municipio de entrega";
  if ((info.barrio?.trim().length ?? 0) < 2) return "el barrio de entrega";
  if ((info.direccion?.trim().length ?? 0) < MIN_DIRECCION_LENGTH) return "tu dirección con señas";
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
    info.direccion && `Señas: ${info.direccion}`,
    info.recibe && `Recibe: ${info.recibe}`,
    hasGps(info) && `Ubicación: ${addressMapsUrl(info)}`,
  ]
    .filter(Boolean)
    .join("\n");
}
