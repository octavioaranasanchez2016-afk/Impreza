import { PaymentInitResult, PaymentProvider } from "./provider";

/**
 * Proveedor "manual": no cobra nada automáticamente. Registra la intención de
 * pago (contra entrega / transferencia / coordinar por WhatsApp) y deja el
 * pedido en "pendiente" o "en_revision" (si el cliente sube comprobante) hasta
 * que el admin lo confirme a mano desde el panel.
 */
export const manualProvider: PaymentProvider = {
  id: "manual",

  async crearCobro(): Promise<PaymentInitResult> {
    return { status: "pendiente" };
  },

  async verificarEstado(): Promise<PaymentInitResult["status"]> {
    // El estado real lo actualiza el admin manualmente en el panel
    // (al confirmar que llegó la transferencia o el pago contra entrega).
    return "pendiente";
  },
};
