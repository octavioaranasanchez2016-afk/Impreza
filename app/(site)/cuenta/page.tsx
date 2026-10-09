import { Suspense } from "react";
import { AccountPanel } from "@/components/AccountPanel";

export const metadata = {
  title: "Mi cuenta",
  description: "Entra con tu correo y mira todos tus pedidos en Impreza.",
  robots: { index: false },
};

export default function CuentaPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-16 md:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Mi cuenta</p>
      <Suspense>
        <AccountPanel />
      </Suspense>
    </section>
  );
}
