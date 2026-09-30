"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ACCOUNT_CURRENCY_LABEL, BANK_ACCOUNTS } from "@/lib/bank";
import { PRODUCTION_BUSINESS_DAYS } from "@/lib/delivery";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

// "50588888888" → "+505 8888 8888"
function formatPhone(digits: string): string {
  const m = digits.match(/^505(\d{4})(\d{4})$/);
  return m ? `+505 ${m[1]} ${m[2]}` : digits ? `+${digits}` : "";
}

// Botón para guardar la cotización como PDF (o imprimirla) y enviarla a la empresa
// antes de pagar. Mientras está en la página, imprimir /pedido saca solo la proforma
// (ver globals.css), sin menús ni formularios.
export function ProformaPrint({ children }: { children: React.ReactNode }) {
  const [host, setHost] = useState<string | null>(null);

  useEffect(() => {
    setHost(window.location.host);
    document.body.classList.add("has-proforma");
    return () => document.body.classList.remove("has-proforma");
  }, []);

  const phone = formatPhone(WHATSAPP_NUMBER);

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-brand border-2 border-ink bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          Descargar proforma (PDF)
        </button>
        <p className="text-xs text-ink-soft">
          Para enviarla a tu empresa o pedir aprobación antes de pagar. En la ventana que se abre, elige «Guardar como
          PDF».
        </p>
      </div>

      {host &&
        createPortal(
          <div id="proforma-print" className="hidden bg-white text-ink">
            <div className="mb-5 flex items-end justify-between gap-4 border-b-2 border-ink pb-3">
              <div>
                <p className="font-display text-5xl uppercase leading-none tracking-wide">Impreza</p>
                <p className="mt-1 text-xs text-ink-soft">Serigrafía · DTF · Sublimado · Bordado — Managua, Nicaragua</p>
              </div>
              <div className="text-right text-xs text-ink-soft">
                <p className="font-semibold text-ink">{host}</p>
                {phone && <p>WhatsApp {phone}</p>}
              </div>
            </div>

            {children}

            {BANK_ACCOUNTS.length > 0 && (
              <div className="mt-5 text-xs">
                <p className="font-semibold text-ink">Forma de pago: transferencia bancaria</p>
                <table className="mt-2 w-full">
                  <tbody>
                    {BANK_ACCOUNTS.map((a) => (
                      <tr key={a.numero} className="border-b border-black/10">
                        <td className="py-1.5 pr-3 text-ink-soft">
                          {a.banco} · {ACCOUNT_CURRENCY_LABEL[a.currency]}
                        </td>
                        <td className="py-1.5 pr-3 font-mono font-semibold text-ink">{a.numero}</td>
                        <td className="py-1.5 text-ink-soft">{a.titular}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <ul className="mt-5 space-y-1 text-xs text-ink-soft">
              <li>
                Para hacer el pedido, confírmalo en {host}/pedido y adjunta el comprobante de tu transferencia.
              </li>
              <li>Tiempo de producción: {PRODUCTION_BUSINESS_DAYS} días hábiles desde que verificamos el pago.</li>
              <li>Esta proforma es una cotización: no sustituye a la factura.</li>
            </ul>
          </div>,
          document.body
        )}
    </>
  );
}
