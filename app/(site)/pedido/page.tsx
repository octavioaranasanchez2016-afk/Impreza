import { Suspense } from "react";
import { OrderForm } from "@/components/OrderForm";

export const metadata = {
  title: "Hacer pedido — Impreza",
};

export default function PedidoPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <h1 className="text-3xl font-bold text-ink md:text-4xl">Arma tu pedido</h1>
      <p className="mt-2 text-ink-soft">
        Sube tu diseño y elige tus productos. El precio se actualiza automáticamente.
      </p>
      <div className="mt-8">
        <Suspense fallback={null}>
          <OrderForm />
        </Suspense>
      </div>
    </section>
  );
}
