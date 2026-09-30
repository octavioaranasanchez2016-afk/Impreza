import { ShippingInfo, WORKSHOP, addressMapsUrl, areaLabel, hasGps } from "@/lib/shipping";
import { shareWhatsAppUrl } from "@/lib/whatsapp";

export function ShippingCard({
  entrega,
  nombre,
  telefono,
  code,
}: {
  entrega: ShippingInfo | null;
  nombre: string;
  telefono: string;
  code: string;
}) {
  return (
    <section className="rounded-brand border border-black/10 bg-white p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-semibold text-ink">Entrega</h2>
        {entrega && (
          <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-paper">
            {entrega.metodo === "domicilio" ? "A domicilio" : "Recoge"}
          </span>
        )}
      </div>

      {!entrega && (
        <p className="mt-2 text-sm text-ink-soft">
          Este pedido no tiene datos de entrega: se hizo antes de esta opción, o la dirección quedó en la nota del
          cliente. Coordínala por WhatsApp.
        </p>
      )}

      {entrega?.metodo === "retiro" && (
        <div className="mt-2 text-sm text-ink-soft">
          <p className="font-semibold text-ink">Recoge en el taller</p>
          <p>
            {WORKSHOP.name} · {WORKSHOP.hours}
          </p>
        </div>
      )}

      {entrega?.metodo === "domicilio" && (
        <>
          <p className="mt-2 text-lg font-semibold leading-snug text-ink">{areaLabel(entrega)}</p>
          {entrega.direccion && <p className="mt-1 text-sm text-ink">{entrega.direccion}</p>}
          {entrega.recibe && (
            <p className="mt-1 text-sm text-ink-soft">
              Recibe: <span className="text-ink">{entrega.recibe}</span>
            </p>
          )}
          {entrega.envio && (
            <p className="mt-2 rounded-brand bg-paper-soft px-3 py-2 text-sm text-ink">
              Delivery cobrado: <span className="font-semibold">C${entrega.envio.costo}</span> · {entrega.envio.km} km
              desde el Taller Impreza{entrega.envio.exacto ? " (con GPS)" : " (estimado por municipio)"}
            </p>
          )}
          <p className="mt-2 text-xs text-ink-muted">
            {hasGps(entrega)
              ? "✓ El cliente compartió su ubicación GPS: el mapa abre el punto exacto."
              : "Sin ubicación GPS: el mapa busca la dirección escrita."}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 print:hidden">
            <a
              href={addressMapsUrl(entrega)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-brand bg-ink px-3 py-2 text-center text-sm font-semibold text-paper hover:opacity-80"
            >
              Abrir mapa
            </a>
            <a
              href={shareWhatsAppUrl(courierMessage(entrega, nombre, telefono, code))}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-brand border border-black/15 px-3 py-2 text-center text-sm font-semibold text-ink hover:border-ink"
            >
              Enviar a repartidor
            </a>
          </div>
          <p className="mt-2 text-[11px] text-ink-muted print:hidden">
            «Enviar a repartidor» abre WhatsApp con la dirección lista para mandársela a quien hace la entrega.
          </p>
        </>
      )}
    </section>
  );
}

function courierMessage(entrega: ShippingInfo, nombre: string, telefono: string, code: string) {
  return [
    `Entrega Impreza — pedido #${code}`,
    `Cliente: ${nombre} (${telefono})`,
    `Zona: ${areaLabel(entrega)}`,
    entrega.direccion && `Señas: ${entrega.direccion}`,
    entrega.recibe && `Recibe: ${entrega.recibe}`,
    `Mapa: ${addressMapsUrl(entrega)}`,
  ]
    .filter(Boolean)
    .join("\n");
}
