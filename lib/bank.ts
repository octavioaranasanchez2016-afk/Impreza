export type AccountCurrency = "NIO" | "USD";

export interface BankAccount {
  banco: string;
  titular?: string;
  numero: string;
  iban?: string;
  currency: AccountCurrency;
}

export const ACCOUNT_CURRENCY_LABEL: Record<AccountCurrency, string> = {
  NIO: "Córdobas",
  USD: "Dólares",
};

// Cuentas donde el cliente transfiere (se muestran públicamente en el sitio).
// Para agregar otra, copia un bloque y cambia sus datos.
// Mientras la lista esté vacía, el formulario pide los datos por WhatsApp.
export const BANK_ACCOUNTS: BankAccount[] = [
  {
    banco: "BAC Credomatic",
    titular: "OCTAVIO JOSE ARANA SANCHEZ",
    numero: "374629087",
    iban: "NI23BAMC00000000000374629087",
    currency: "NIO",
  },
  {
    banco: "BAC Credomatic",
    titular: "OCTAVIO JOSE ARANA SANCHEZ",
    numero: "374224566",
    iban: "NI84BAMC00000000000374224566",
    currency: "USD",
  },
];

export const ACCEPTED_RECEIPT_TYPES = ["image/jpeg", "image/png"];
export const MAX_RECEIPT_SIZE_MB = 10;

export function validateReceiptFile(file: File): string | null {
  if (!ACCEPTED_RECEIPT_TYPES.includes(file.type)) {
    return "El comprobante debe ser una foto o captura de pantalla (JPG o PNG).";
  }
  if (file.size > MAX_RECEIPT_SIZE_MB * 1024 * 1024) {
    return `El comprobante pesa demasiado (máximo ${MAX_RECEIPT_SIZE_MB}MB).`;
  }
  return null;
}
