// Teléfonos por país: cuántos números lleva y con qué empieza, para no aceptar letras
// ni números incompletos. Lo usan el formulario (para avisar mientras escriben) y el
// servidor (para no guardar un pedido con un teléfono que no sirve). Se guarda como
// "+505 8888 8888", que es lo que entienden WhatsApp y el botón de llamar.

export interface PhoneCountry {
  code: string;
  name: string;
  flag: string;
  dial: string; // código del país, sin "+"
  example: string;
  rule: string; // cómo es un número de ahí, para el aviso
  valid: (digits: string) => boolean;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "NI", name: "Nicaragua", flag: "🇳🇮", dial: "505", example: "8888 8888", rule: "8 números que empiezan con 2, 5, 7 u 8", valid: (d) => /^[2578]\d{7}$/.test(d) },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", dial: "506", example: "8888 8888", rule: "8 números que empiezan con 2, 4, 5, 6, 7 u 8", valid: (d) => /^[245678]\d{7}$/.test(d) },
  { code: "HN", name: "Honduras", flag: "🇭🇳", dial: "504", example: "9999 9999", rule: "8 números que empiezan con 2, 3, 7, 8 o 9", valid: (d) => /^[23789]\d{7}$/.test(d) },
  { code: "SV", name: "El Salvador", flag: "🇸🇻", dial: "503", example: "7777 7777", rule: "8 números que empiezan con 2, 6 o 7", valid: (d) => /^[267]\d{7}$/.test(d) },
  { code: "GT", name: "Guatemala", flag: "🇬🇹", dial: "502", example: "5555 5555", rule: "8 números que empiezan del 2 al 7", valid: (d) => /^[2-7]\d{7}$/.test(d) },
  { code: "PA", name: "Panamá", flag: "🇵🇦", dial: "507", example: "6666 6666", rule: "8 números si es celular (empieza con 6) o 7 si es fijo", valid: (d) => /^6\d{7}$/.test(d) || /^[2-9]\d{6}$/.test(d) },
  { code: "US", name: "Estados Unidos / Canadá", flag: "🇺🇸", dial: "1", example: "305 555 1234", rule: "10 números (código de área y número)", valid: (d) => /^[2-9]\d{2}[2-9]\d{6}$/.test(d) },
  { code: "MX", name: "México", flag: "🇲🇽", dial: "52", example: "55 1234 5678", rule: "10 números", valid: (d) => /^[1-9]\d{9}$/.test(d) },
  { code: "CO", name: "Colombia", flag: "🇨🇴", dial: "57", example: "300 123 4567", rule: "10 números (celular con 3, fijo con 60)", valid: (d) => /^(3\d{9}|60\d{8})$/.test(d) },
  { code: "ES", name: "España", flag: "🇪🇸", dial: "34", example: "612 345 678", rule: "9 números que empiezan con 6, 7, 8 o 9", valid: (d) => /^[6-9]\d{8}$/.test(d) },
];

// Otro país: el número completo con su código (lo más largo que permite el estándar).
export const OTHER_COUNTRY = "OTRO";
const validInternational = (d: string) => /^[1-9]\d{7,14}$/.test(d);

export const DEFAULT_PHONE_COUNTRY = "NI";

export const phoneCountry = (code: string) => PHONE_COUNTRIES.find((c) => c.code === code);

// Solo deja números, espacios, guiones y paréntesis mientras escriben.
export const cleanPhoneInput = (value: string) => value.replace(/[^\d\s()+-]/g, "").slice(0, 24);

const digitsOf = (value: string) => value.replace(/\D/g, "");

// Si el número escrito ya trae el código del país (p. ej. "505 8888 8888"), se le quita.
function localDigits(country: PhoneCountry, value: string): string {
  const d = digitsOf(value);
  return d.startsWith(country.dial) && !country.valid(d) && country.valid(d.slice(country.dial.length))
    ? d.slice(country.dial.length)
    : d;
}

// "8888 8888" en Nicaragua → "+505 8888 8888". null si no es un número válido de ahí.
export function formatPhone(countryCode: string, value: string): string | null {
  if (countryCode === OTHER_COUNTRY) {
    const d = digitsOf(value);
    return validInternational(d) ? `+${d}` : null;
  }
  const country = phoneCountry(countryCode);
  if (!country) return null;
  const d = localDigits(country, value);
  if (!country.valid(d)) return null;
  const grouped = d.length === 8 ? `${d.slice(0, 4)} ${d.slice(4)}` : d.length === 7 ? `${d.slice(0, 3)} ${d.slice(3)}` : d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : d;
  return `+${country.dial} ${grouped}`;
}

// Por qué no sirve (para el aviso), o null si está bien o todavía no escriben nada.
export function phoneProblem(countryCode: string, value: string): string | null {
  if (!digitsOf(value)) return null;
  if (formatPhone(countryCode, value)) return null;
  if (countryCode === OTHER_COUNTRY) return "Escribe el número completo con el código de tu país (por ejemplo +1 305 555 1234).";
  const country = phoneCountry(countryCode);
  return country ? `En ${country.name} son ${country.rule}. Ejemplo: ${country.example}.` : "Elige el país de tu teléfono.";
}

// Un teléfono ya guardado ("+505 8888 8888", o de antes, "8888 8888") separado en
// país y número, para volver a mostrarlo en el formulario.
export function splitPhone(stored: string): { country: string; local: string } {
  const value = stored.trim();
  if (!value.startsWith("+")) return { country: DEFAULT_PHONE_COUNTRY, local: value };
  const d = digitsOf(value);
  const match = [...PHONE_COUNTRIES]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((c) => d.startsWith(c.dial) && c.valid(d.slice(c.dial.length)));
  if (!match) return { country: OTHER_COUNTRY, local: value };
  return { country: match.code, local: d.slice(match.dial.length) };
}

// Para el servidor: el teléfono que mandó el formulario, ya revisado y con formato.
// Los de antes, sin código de país, se toman como de Nicaragua.
export function normalizeStoredPhone(value: string): string | null {
  const v = value.trim();
  if (v.startsWith("+")) {
    const { country, local } = splitPhone(v);
    return country === OTHER_COUNTRY ? formatPhone(OTHER_COUNTRY, v) : formatPhone(country, local);
  }
  return formatPhone(DEFAULT_PHONE_COUNTRY, v);
}
