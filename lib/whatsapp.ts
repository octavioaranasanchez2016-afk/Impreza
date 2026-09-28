// Enlace de WhatsApp al número del CLIENTE (no al del taller). Los clientes
// escriben su número de muchas formas ("8888 8888", "+505 8888-8888"...);
// un número local de 8 dígitos se asume de Nicaragua.
export function clientWhatsAppUrl(phone: string, message: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 8) digits = `505${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function telUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `tel:${digits.length === 8 ? `+505${digits}` : `+${digits}`}`;
}

// Sin número: WhatsApp deja elegir a quién mandarlo (p. ej. al repartidor).
export function shareWhatsAppUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
