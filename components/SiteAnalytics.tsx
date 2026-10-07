"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Visitas y velocidad del sitio público (Vercel → Analytics / Speed Insights).
// No usa cookies. Antes de enviar cada visita se quitan los datos de pedidos:
// el código de la página de un pedido, el ?codigo= del rastreo y la ?clave= del
// organizador de una lista de tallas.
function scrub<T extends { url: string }>(event: T): T {
  const url = new URL(event.url);
  url.pathname = url.pathname.replace(/^\/pedido\/[^/]+\/confirmacion/, "/pedido/[id]/confirmacion");
  url.searchParams.delete("codigo");
  url.searchParams.delete("clave");
  return { ...event, url: url.toString() };
}

export function SiteAnalytics() {
  return (
    <>
      <Analytics beforeSend={(event: BeforeSendEvent) => scrub(event)} />
      <SpeedInsights beforeSend={(event) => scrub(event)} />
    </>
  );
}
