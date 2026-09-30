"use client";

import { useEffect, useRef, useState } from "react";
import { CropRect } from "@/lib/design";

// Recorte de la imagen: el cliente mueve un marco sobre su imagen y ajusta el zoom
// para elegir el encuadre que se imprime.

const MIN_SHORT_SIDE_PX = 1000; // por debajo, la impresión puede verse borrosa

interface AspectOption {
  label: string;
  value: number; // ancho / alto en píxeles
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// El marco más grande con esa proporción que cabe en la imagen (en fracciones).
function maxFrame(aspect: number, width: number, height: number) {
  const imageAspect = width / height;
  return imageAspect > aspect ? { w: (aspect * height) / width, h: 1 } : { w: 1, h: width / (aspect * height) };
}

export function ImageCropper({
  src,
  width,
  height,
  areaAspect,
  areaLabel,
  initialCrop,
  onCancel,
  onApply,
}: {
  src: string;
  width: number;
  height: number;
  areaAspect: number;
  areaLabel: string;
  initialCrop?: CropRect;
  onCancel: () => void;
  onApply: (crop: CropRect, fillsArea: boolean) => void;
}) {
  // Si el área ya tiene la forma de alguna opción (30 × 40 cm es vertical 3:4), esa sobra.
  const options: AspectOption[] = [
    { label: `Área de impresión · ${areaLabel}`, value: areaAspect },
    ...[
      { label: "Cuadrado 1:1", value: 1 },
      { label: "Vertical 3:4", value: 3 / 4 },
      { label: "Horizontal 4:3", value: 4 / 3 },
    ].filter((o) => Math.abs(o.value - areaAspect) > 0.01),
  ];

  const initialAspect = initialCrop ? (initialCrop.w * width) / (initialCrop.h * height) : areaAspect;
  const [aspect, setAspect] = useState(initialAspect);
  const [zoom, setZoom] = useState(() =>
    initialCrop ? clamp(initialCrop.w / maxFrame(initialAspect, width, height).w, 0.15, 1) : 1
  );
  const [center, setCenter] = useState(() =>
    initialCrop ? { x: initialCrop.x + initialCrop.w / 2, y: initialCrop.y + initialCrop.h / 2 } : { x: 0.5, y: 0.5 }
  );
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number; cx: number; cy: number } | null>(null);

  const max = maxFrame(aspect, width, height);
  const w = max.w * zoom;
  const h = max.h * zoom;
  const x = clamp(center.x - w / 2, 0, 1 - w);
  const y = clamp(center.y - h / 2, 0, 1 - h);
  const crop: CropRect = { x, y, w, h };
  const outW = Math.round(w * width);
  const outH = Math.round(h * height);
  const lowRes = Math.min(outW, outH) < MIN_SHORT_SIDE_PX;
  const fillsArea = Math.abs(aspect - areaAspect) < 0.001;

  // Esc cierra, como cualquier ventana.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault();
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {
      // Sin captura el arrastre igual funciona mientras el dedo siga encima.
    }
    drag.current = { px: e.clientX, py: e.clientY, cx: x + w / 2, cy: y + h / 2 };
  }

  function onPointerMove(e: React.PointerEvent) {
    const start = drag.current;
    const box = boxRef.current?.getBoundingClientRect();
    if (!start || !box) return;
    setCenter({
      x: clamp(start.cx + (e.clientX - start.px) / box.width, w / 2, 1 - w / 2),
      y: clamp(start.cy + (e.clientY - start.py) / box.height, h / 2, 1 - h / 2),
    });
  }

  function chooseAspect(value: number) {
    setAspect(value);
    setZoom(1);
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-3"
      role="dialog"
      aria-modal="true"
      aria-label="Recortar imagen"
    >
      <div className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-brand bg-white p-4 shadow-xl">
        <p className="font-semibold text-ink">Recortar imagen</p>
        <p className="text-xs text-ink-soft">Arrastra el marco para encuadrar y ajusta el zoom.</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {options.map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => chooseAspect(o.value)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                Math.abs(aspect - o.value) < 0.001 ? "border-ink bg-ink text-paper" : "border-black/15 text-ink hover:border-ink"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex justify-center rounded-brand bg-paper-soft p-2">
          <div
            ref={boxRef}
            className="relative touch-none select-none overflow-hidden"
            style={{ aspectRatio: `${width} / ${height}`, width: `min(100%, calc(55vh * ${width / height}))` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
          >
            <img src={src} alt="Tu imagen" draggable={false} className="block h-full w-full" />
            <div
              className="absolute cursor-move border-2 border-white"
              style={{
                left: `${x * 100}%`,
                top: `${y * 100}%`,
                width: `${w * 100}%`,
                height: `${h * 100}%`,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
              }}
            >
              {/* Líneas de tercios, como la cámara del teléfono. */}
              <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span key={i} className="border border-white/25" />
                ))}
              </div>
            </div>
          </div>
        </div>

        <label className="mt-3 flex items-center gap-3 text-xs font-medium text-ink-soft">
          Zoom
          <input
            type="range"
            min={0.15}
            max={1}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-ink"
            aria-label="Zoom del recorte"
          />
        </label>

        <p className={`mt-2 text-xs ${lowRes ? "font-medium text-yellow-700" : "text-ink-muted"}`}>
          Resolución del recorte: {outW} × {outH} px.
          {lowRes && " Resolución baja: podría verse borrosa. Reduce el zoom o usa una imagen de mayor resolución."}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-brand border border-black/15 px-4 py-2.5 text-sm font-semibold text-ink hover:border-ink"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              onApply(crop, fillsArea);
            }}
            className="rounded-brand bg-ink px-4 py-2.5 text-sm font-semibold text-paper hover:opacity-80 disabled:opacity-50"
          >
            {busy ? "Aplicando..." : "Aplicar recorte"}
          </button>
        </div>
      </div>
    </div>
  );
}
