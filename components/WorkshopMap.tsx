"use client";

import { useState } from "react";
import { WORKSHOP } from "@/lib/shipping";

// Mapa del taller. El mapa de Google se carga solo cuando el cliente lo pide:
// así la página abre más rápido y no se conecta a Google sin que el cliente quiera.
export function WorkshopMap({ className = "" }: { className?: string }) {
  const [show, setShow] = useState(false);
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${WORKSHOP.lat},${WORKSHOP.lng}`;

  if (show) {
    return (
      <iframe
        title="Mapa de Arango Textil"
        src={`https://www.google.com/maps/embed?origin=mfe&pb=!1m3!2m1!1s${WORKSHOP.lat},${WORKSHOP.lng}!6i16!3m1!1ses!5m1!1ses`}
        className={`h-full w-full border-0 ${className}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    );
  }

  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center gap-4 bg-paper-soft p-6 text-center ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-paper shadow-lg">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" strokeLinejoin="round" />
          <circle cx="12" cy="9.5" r="2.5" />
        </svg>
      </span>
      <p className="text-sm font-semibold text-ink">{WORKSHOP.name}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => setShow(true)}
          className="rounded-brand bg-ink px-4 py-2 text-sm font-semibold text-paper hover:opacity-80"
        >
          Ver mapa
        </button>
        <a
          href={directions}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-brand border border-ink/20 bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-ink"
        >
          Cómo llegar ↗
        </a>
      </div>
    </div>
  );
}
