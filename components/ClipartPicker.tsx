"use client";

import { useEffect, useState } from "react";
import { CLIPART, Clipart } from "@/lib/clipart";
import { TEXT_COLOR_OPTIONS } from "@/lib/design";

// Ventana para elegir un dibujo (birrete, balón, corona…) y su color.
export function ClipartPicker({
  initialColor,
  onPick,
  onClose,
}: {
  initialColor: string;
  onPick: (item: Clipart, color: string) => void;
  onClose: () => void;
}) {
  const [color, setColor] = useState(initialColor);
  const groups = [...new Set(CLIPART.map((c) => c.group))];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Agregar un dibujo"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-brand bg-white p-5 sm:rounded-brand"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-2xl uppercase leading-none tracking-wide text-ink">Agregar un dibujo</p>
            <p className="mt-1 text-xs text-ink-muted">Elige el color y toca el dibujo. Después lo mueves y lo agrandas.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="px-1 text-xl leading-none text-ink-muted hover:text-ink">
            ×
          </button>
        </div>

        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">Color</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TEXT_COLOR_OPTIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              title={c.label}
              aria-label={c.label}
              aria-pressed={color.toLowerCase() === c.value.toLowerCase()}
              className={`h-7 w-7 rounded-full border ${
                color.toLowerCase() === c.value.toLowerCase() ? "ring-2 ring-ink ring-offset-2" : "border-black/15"
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>

        {groups.map((group) => (
          <div key={group} className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">{group}</p>
            <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
              {CLIPART.filter((c) => c.group === group).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onPick(item, color)}
                  className={`flex flex-col items-center gap-1 rounded-brand border border-black/10 p-2 text-[11px] font-semibold text-ink-soft transition-colors hover:border-ink hover:text-ink ${
                    color.toLowerCase() === "#ffffff" ? "bg-ink/80" : "bg-paper-soft"
                  }`}
                >
                  <svg
                    viewBox="0 0 100 100"
                    className="h-10 w-10"
                    style={{ color }}
                    fill="currentColor"
                    aria-hidden
                    dangerouslySetInnerHTML={{ __html: item.svg }}
                  />
                  <span className={color.toLowerCase() === "#ffffff" ? "text-paper" : ""}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
