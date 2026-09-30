"use client";

import { useEffect, useRef, useState } from "react";
import {
  MUNICIPIOS,
  OTHER_MUNICIPIO,
  SHIPPING_COST_NOTE,
  deliveryQuote,
  ShippingInfo,
  ShippingMethod,
  WORKSHOP,
  addressMapsUrl,
  hasGps,
} from "@/lib/shipping";

type GpsState = "idle" | "locating" | "error";

// El costo del delivery según la distancia desde el Taller Impreza.
function DeliveryBox({ quote, municipio }: { quote: ReturnType<typeof deliveryQuote>; municipio?: string }) {
  if (!quote) {
    return (
      <div className="rounded-brand border border-dashed border-black/20 px-4 py-3 text-xs text-ink-soft">
        {municipio === OTHER_MUNICIPIO
          ? "Para envíos fuera de la lista de municipios, comparte tu ubicación y calculamos el delivery por kilómetro."
          : SHIPPING_COST_NOTE}
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3 rounded-brand border-2 border-ink bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">Delivery · {quote.km} km desde el Taller Impreza</p>
        <p className="text-[11px] text-ink-soft">
          {quote.exacto
            ? "Calculado con tu ubicación."
            : `Estimado para ${municipio}. Comparte tu ubicación para el cálculo exacto.`}{" "}
          {SHIPPING_COST_NOTE}
        </p>
      </div>
      <p className="shrink-0 text-lg font-bold text-ink">C${quote.costo}</p>
    </div>
  );
}

export function ShippingForm({
  value,
  onChange,
}: {
  value: ShippingInfo | null;
  onChange: (next: ShippingInfo) => void;
}) {
  const [gps, setGps] = useState<GpsState>("idle");
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Guarda la dirección escrita aunque el cliente cambie a "recoger" y vuelva.
  const [draft, setDraft] = useState<ShippingInfo>({ metodo: "domicilio", municipio: MUNICIPIOS[0] });
  const metodo = value?.metodo ?? null;
  const address = value?.metodo === "domicilio" ? value : draft;
  // El GPS responde segundos después: para no borrar lo que el cliente escribió mientras tanto.
  const latest = useRef(address);
  useEffect(() => {
    latest.current = address;
  });

  function choose(next: ShippingMethod) {
    onChange(next === "retiro" ? { metodo: "retiro" } : address);
  }

  function update(patch: Partial<ShippingInfo>) {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setDraft(next);
    onChange(next);
  }

  function shareLocation() {
    if (!navigator.geolocation) {
      setGps("error");
      setGpsError("Tu navegador no permite compartir la ubicación. Escribe tu dirección con señas.");
      return;
    }
    setGps("locating");
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps("idle");
        update({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setGps("error");
        setGpsError(
          err.code === err.PERMISSION_DENIED
            ? "No diste permiso para usar tu ubicación. No pasa nada: con tu dirección con señas es suficiente."
            : "No pudimos obtener tu ubicación. Intenta de nuevo o escribe tu dirección con señas."
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <MethodOption
          active={metodo === "domicilio"}
          onClick={() => choose("domicilio")}
          icon={<HouseIcon />}
          title="Entrega a domicilio"
          hint="Te lo llevamos hasta tu puerta"
        />
        <MethodOption
          active={metodo === "retiro"}
          onClick={() => choose("retiro")}
          icon={<StoreIcon />}
          title="Recoger en el taller"
          hint={`Gratis · ${WORKSHOP.name}`}
        />
      </div>

      {metodo === "retiro" && (
        <div className="rounded-brand bg-paper-soft p-4 text-sm text-ink-soft">
          <p className="font-semibold text-ink">{WORKSHOP.name}</p>
          <p className="mt-0.5">{WORKSHOP.hours}</p>
          <p className="mt-1">Te avisamos por WhatsApp cuando tu pedido esté listo para recoger.</p>
          <a
            href={WORKSHOP.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block font-semibold text-ink underline"
          >
            Ver en Google Maps ↗
          </a>
        </div>
      )}

      {metodo === "domicilio" && (
        <div className="space-y-3 rounded-brand border border-black/10 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Municipio *">
              <select value={address.municipio ?? ""} onChange={(e) => update({ municipio: e.target.value })} className="input">
                {MUNICIPIOS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={address.municipio === OTHER_MUNICIPIO ? "Ciudad y barrio *" : "Barrio o residencial *"}>
              <input
                value={address.barrio ?? ""}
                onChange={(e) => update({ barrio: e.target.value })}
                className="input"
                placeholder={address.municipio === OTHER_MUNICIPIO ? "Ej. León, barrio San Felipe" : "Ej. Bolonia"}
                autoComplete="address-level3"
              />
            </Field>
          </div>

          <Field label="Dirección con señas *">
            <textarea
              value={address.direccion ?? ""}
              onChange={(e) => update({ direccion: e.target.value })}
              className="input min-h-[76px] resize-y"
              placeholder="Ej. De la rotonda El Güegüense 2 c. al sur, 1/2 c. arriba. Casa esquinera de portón negro."
              autoComplete="street-address"
              maxLength={400}
            />
          </Field>

          <Field label="¿Quién recibe? (opcional)">
            <input
              value={address.recibe ?? ""}
              onChange={(e) => update({ recibe: e.target.value })}
              className="input"
              placeholder="Nombre y teléfono, si no eres tú"
            />
          </Field>

          <div className="rounded-brand bg-paper-soft p-3">
            {hasGps(address) ? (
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-ink">✓ Ubicación GPS guardada</span>
                <span className="flex gap-3 text-xs">
                  <a
                    href={addressMapsUrl(address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-ink underline"
                  >
                    Ver en el mapa ↗
                  </a>
                  <button
                    type="button"
                    onClick={() => update({ lat: undefined, lng: undefined })}
                    className="font-semibold text-ink-soft hover:text-ink hover:underline"
                  >
                    Quitar
                  </button>
                </span>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={shareLocation}
                  disabled={gps === "locating"}
                  className="flex w-full items-center justify-center gap-2 rounded-brand border border-ink/20 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink disabled:opacity-60"
                >
                  <PinIcon />
                  {gps === "locating" ? "Buscando tu ubicación..." : "Compartir mi ubicación actual (opcional)"}
                </button>
                <p className="mt-1.5 text-center text-[11px] text-ink-muted">
                  Úsalo si estás en el lugar de entrega: así el repartidor llega directo.
                </p>
              </>
            )}
            {gpsError && <p className="mt-2 text-xs font-medium text-red-600">{gpsError}</p>}
          </div>

          <DeliveryBox quote={deliveryQuote(address)} municipio={address.municipio} />
        </div>
      )}
    </div>
  );
}

function MethodOption({
  active,
  onClick,
  icon,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-3 rounded-brand border-2 px-4 py-3 text-left transition-colors ${
        active ? "border-ink bg-ink text-paper" : "border-black/10 bg-white text-ink hover:border-ink"
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${active ? "bg-paper/15" : "bg-paper-soft"}`}>
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className={`block text-xs ${active ? "text-paper/70" : "text-ink-soft"}`}>{hint}</span>
      </span>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

function HouseIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path d="M3 9.5 10 4l7 5.5M5 8v8h10V8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 16v-4h3v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path d="M3.5 8 5 4h10l1.5 4M3.5 8h13M3.5 8a2.2 2.2 0 0 0 4.3 0 2.2 2.2 0 0 0 4.4 0 2.2 2.2 0 0 0 4.3 0" strokeLinejoin="round" />
      <path d="M5 10.5V16h10v-5.5M8.5 16v-3h3v3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M10 17s5-4.6 5-8.5a5 5 0 0 0-10 0C5 12.4 10 17 10 17Z" strokeLinejoin="round" />
      <circle cx="10" cy="8.5" r="1.8" />
    </svg>
  );
}
