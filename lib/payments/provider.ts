export type PaymentInitStatus = "pendiente" | "en_revision" | "pagado" | "fallido";

export interface PaymentInitResult {
  status: PaymentInitStatus;
  // Presente cuando el proveedor requiere redirigir al cliente (ej. checkout de BAC).
  redirectUrl?: string;
  // Referencia externa del proveedor (ID de transacción de la pasarela), si aplica.
  providerReference?: string;
}

/**
 * Contrato que debe cumplir cualquier método de cobro. El monto SIEMPRE llega
 * ya calculado por lib/pricing.ts — ningún proveedor decide ni conoce cómo se
 * compuso el precio, solo cobra el total final.
 */
export interface PaymentProvider {
  readonly id: string;
  crearCobro(params: {
    orderId: string;
    montoTotal: number;
    moneda: "NIO" | "USD";
    clienteNombre: string;
    clienteTelefono: string;
  }): Promise<PaymentInitResult>;
  verificarEstado(orderId: string): Promise<PaymentInitStatus>;
}
