import { PaymentProvider } from "./provider";
import { manualProvider } from "./manual";
import { bacProvider } from "./bac";

const PROVIDERS: Record<string, PaymentProvider> = {
  manual: manualProvider,
  bac: bacProvider,
};

// Cambia PAYMENT_PROVIDER en .env cuando la integración con BAC esté lista.
// Ningún otro archivo necesita saber cuál proveedor está activo.
export function getActivePaymentProvider(): PaymentProvider {
  const id = process.env.PAYMENT_PROVIDER || "manual";
  const provider = PROVIDERS[id];
  if (!provider) {
    throw new Error(`PAYMENT_PROVIDER "${id}" no existe.`);
  }
  return provider;
}
