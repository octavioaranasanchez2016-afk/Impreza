"use client";

import { useState } from "react";

export interface FaqSection {
  id: string;
  title: string;
  faqs: { q: string; a: string }[];
}

// "Técnica" y "tecnica" cuentan igual: sin tildes y en minúsculas.
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Preguntas frecuentes con buscador. extras: lo que va debajo de una sección
// (la comparación de técnicas, la barra de descuentos); se ocultan al buscar.
export function FaqList({ sections, extras = {} }: { sections: FaqSection[]; extras?: Record<string, React.ReactNode> }) {
  const [query, setQuery] = useState("");
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const searching = words.length > 0;

  // Cada palabra buscada tiene que ser el inicio de una palabra ("ruc" encuentra
  // "RUC", no "instrucciones"). Primero las que tienen todas; si ninguna, las que
  // tienen alguna.
  const matches = (f: { q: string; a: string }, mode: "every" | "some") => {
    const text = normalize(`${f.q} ${f.a}`).split(/[^a-z0-9]+/);
    return words[mode]((w) => text.some((t) => t.startsWith(w)));
  };
  const filterBy = (mode: "every" | "some") =>
    sections.map((s) => ({ ...s, faqs: s.faqs.filter((f) => matches(f, mode)) })).filter((s) => s.faqs.length > 0);
  const strict = searching ? filterBy("every") : sections;
  const visible = searching && strict.length === 0 ? filterBy("some") : strict;
  const count = visible.reduce((n, s) => n + s.faqs.length, 0);

  return (
    <div>
      <div className="relative mt-8">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca tu pregunta: RUC, delivery, tallas…"
          aria-label="Buscar en las preguntas frecuentes"
          className="input h-12 pl-10 text-base"
        />
      </div>
      {searching ? (
        <p className="mt-2 text-xs text-ink-soft" aria-live="polite">
          {count === 0 ? "No encontramos esa pregunta: escríbenos por WhatsApp aquí abajo." : `${count} respuesta${count === 1 ? "" : "s"}`}
        </p>
      ) : (
        <nav className="mt-4 flex flex-wrap gap-2" aria-label="Temas">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full border border-black/15 px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
            >
              {s.title}
            </a>
          ))}
        </nav>
      )}

      <div className="mt-10 space-y-10">
        {visible.map((s) => (
          <div key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="font-display text-3xl uppercase tracking-wide text-ink">{s.title}</h2>
            <div className="mt-3 divide-y divide-black/5 rounded-brand border border-black/10 bg-white">
              {s.faqs.map((f) => (
                // Al buscar, las respuestas encontradas se muestran abiertas.
                <details key={`${f.q}-${searching}`} open={searching || undefined} className="group p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink">
                    {f.q}
                    <span className="shrink-0 text-xl leading-none text-ink-soft transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{f.a}</p>
                </details>
              ))}
            </div>
            {!searching && extras[s.id]}
          </div>
        ))}
      </div>
    </div>
  );
}
