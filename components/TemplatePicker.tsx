"use client";

import { useEffect, useState } from "react";
import { ProductCategory } from "@/lib/types";
import { BuiltTemplate, DesignTemplate, buildTemplate, templatesFor } from "@/lib/plantillas";
import { DesignMockup } from "./DesignMockup";

// Ventana con las plantillas para esta prenda y este color, cada una con su vista previa
// del frente. Elegir una la pone en el diseñador (frente y espalda).
export function TemplatePicker({
  category,
  garmentHex,
  size,
  onApply,
  onClose,
  replacesDesign = false,
}: {
  category: ProductCategory;
  garmentHex: string;
  size?: string;
  onApply: (built: BuiltTemplate, template: DesignTemplate) => void;
  onClose: () => void;
  // Ya hay algo en el diseño: se avisa que la plantilla lo cambia.
  replacesDesign?: boolean;
}) {
  const [built, setBuilt] = useState<{ template: DesignTemplate; result: BuiltTemplate }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all(templatesFor(category).map(async (template) => ({ template, result: await buildTemplate(template, category, garmentHex) })))
      .then((list) => alive && setBuilt(list))
      .catch(() => alive && setError("No pudimos preparar las plantillas. Intenta de nuevo."));
    return () => {
      alive = false;
    };
  }, [category, garmentHex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Plantillas"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-brand bg-white p-5 sm:rounded-brand"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-2xl uppercase leading-none tracking-wide text-ink">Plantillas listas</p>
            <p className="mt-1 text-xs text-ink-muted">
              Elige una y después cambia los textos por los tuyos: tu nombre, el año, tu equipo o tu logo.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="px-1 text-xl leading-none text-ink-muted hover:text-ink">
            ×
          </button>
        </div>

        {replacesDesign && (
          <p className="mt-3 rounded-brand border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            La plantilla cambia lo que tienes ahora en el diseño.
          </p>
        )}
        {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
        {!built && !error && <p className="mt-6 text-sm text-ink-muted">Preparando las plantillas…</p>}

        {built && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {built.map(({ template, result }) => {
              const frente = result.content.frente;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => onApply(result, template)}
                  className="group rounded-brand border border-black/10 p-2 text-left transition-colors hover:border-ink"
                >
                  <div className="pointer-events-none">
                    <DesignMockup
                      category={category}
                      zone="frente"
                      color={garmentHex}
                      size={size}
                      content={frente ?? null}
                      transform={result.transforms.frente ?? { x: 50, y: 40, scale: 0.8, rotation: 0 }}
                      extras={(result.extras.frente ?? []).map((e) => ({ content: e.content, transform: e.transform }))}
                      interactive={false}
                      compact
                    />
                  </div>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">{template.occasion}</p>
                  <p className="text-sm font-semibold text-ink group-hover:underline">{template.name}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">
                    {result.content.espalda ? "Frente y espalda · " : ""}
                    {template.hint}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
