import { PaymentInitResult, PaymentProvider } from "./provider";

/**
 * STUB — completar cuando llegue la documentación técnica de BAC Credomatic.
 *
 * Sin importar si BAC entrega un link de pago dinámico, un checkout embebido
 * o un gateway con API REST, esta clase es el ÚNICO lugar que debe cambiar:
 * el formulario de pedido, lib/pricing.ts y el panel de admin no se tocan.
 *
 * Pasos esperados al implementar:
 * 1. Llamar a la API de BAC en crearCobro() pasando montoTotal (ya calculado
 *    dinámicamente, nunca un precio fijo) y el orderId como referencia externa.
 * 2. Si BAC devuelve un link/checkout, retornarlo en `redirectUrl` para que
 *    /pedido/[id]/confirmacion redirija al cliente.
 * 3. Configurar el webhook de BAC apuntando a /api/pagos/webhook, que debe
 *    llamar a verificarEstado() o actualizar la orden directamente.
 * 4. Mover las credenciales (BAC_API_KEY, BAC_MERCHANT_ID, etc.) a variables
 *    de entorno — nunca hardcodearlas aquí.
 */
export const bacProvider: PaymentProvider = {
  id: "bac",

  async crearCobro(): Promise<PaymentInitResult> {
    throw new Error(
      "Proveedor BAC aún no implementado. Configura PAYMENT_PROVIDER=manual mientras se integra."
    );
  },

  async verificarEstado(): Promise<PaymentInitResult["status"]> {
    throw new Error("Proveedor BAC aún no implementado.");
  },
};
