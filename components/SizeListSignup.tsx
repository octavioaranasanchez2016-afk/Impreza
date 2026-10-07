"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductCategory } from "@/lib/types";
import { SizeChartButton } from "./SizeChartButton";
import { GroupShirtPreview } from "./GroupShirtPreview";
import {
  GroupPersonal,
  MAX_EXTRA,
  MAX_NUMERO,
  MAX_TEXTO,
  NAME_COLORS,
  NAME_FONTS,
  camposPedidos,
} from "@/lib/group-names";
import { FONT_OPTIONS, FontFamilyKey } from "@/lib/design";
import { GroupDesignPreview } from "@/lib/group-design";

// Los registros que este teléfono hizo en la lista, para poder quitarlos.
interface Mine {
  id: string;
  token: string;
  nombre: string;
  talla: string;
  cantidad: number;
  texto?: string;
  numero?: string;
  extra?: string;
}

const mineKey = (listId: string) => `impreza-lista-${listId}`;

function readMine(listId: string): Mine[] {
  try {
    const raw = localStorage.getItem(mineKey(listId));
    return raw ? (JSON.parse(raw) as Mine[]) : [];
  } catch {
    return [];
  }
}

function writeMine(listId: string, mine: Mine[]) {
  try {
    localStorage.setItem(mineKey(listId), JSON.stringify(mine));
  } catch {
    // Sin almacenamiento: el registro queda igual, solo que no se puede quitar desde aquí.
  }
}

export function SizeListSignup({
  listId,
  sizes,
  closed,
  category,
  productName,
  title = "Anótate",
  forOthers = false,
  colorHex = "#FFFFFF",
  designs = {},
  personal = null,
}: {
  listId: string;
  sizes: string[];
  closed: boolean;
  category: ProductCategory;
  productName: string;
  title?: string;
  forOthers?: boolean; // el organizador anota a otra persona
  colorHex?: string; // color de la camisa, para la vista previa
  designs?: GroupDesignPreview; // el diseño de todos, si el organizador ya lo hizo
  personal?: GroupPersonal | null; // lo que pone cada quien en su camisa (null: todas iguales)
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [talla, setTalla] = useState(sizes.length === 1 ? sizes[0] : "");
  const [cantidad, setCantidad] = useState(1);
  const [texto, setTexto] = useState("");
  const [numero, setNumero] = useState("");
  const [extra, setExtra] = useState("");
  // La letra y el color de sus textos, si el organizador lo deja elegir (si no, los de la camisa de ejemplo).
  const firstField = personal?.campos[0];
  const [miFuente, setMiFuente] = useState<FontFamilyKey | undefined>(firstField?.fuente);
  const [miColor, setMiColor] = useState<string | undefined>(firstField?.color);
  const eligen = personal?.eligen ?? { color: false, fuente: false };
  const campos = camposPedidos(personal);
  const withName = campos.nombre;
  const withNumber = campos.numero;
  const withExtra = campos.texto;
  const hasDesign = Object.keys(designs).length > 0;
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mine, setMine] = useState<Mine[]>([]);
  const [justAdded, setJustAdded] = useState<Mine | null>(null);

  useEffect(() => setMine(readMine(listId)), [listId]);

  async function add() {
    setSending(true);
    setError(null);
    const res = await fetch(`/api/listas/${listId}/personas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        talla,
        cantidad,
        texto,
        numero,
        extra,
        estilo: { ...(eligen.fuente ? { fuente: miFuente } : {}), ...(eligen.color ? { color: miColor } : {}) },
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      setError(data.error || "No se pudo guardar.");
      return;
    }
    const entry: Mine = {
      id: data.id,
      token: data.token,
      nombre: nombre.trim(),
      talla,
      cantidad,
      texto: texto.trim(),
      numero,
      extra: extra.trim(),
    };
    const next = [...mine, entry];
    setMine(next);
    writeMine(listId, next);
    setJustAdded(entry);
    setNombre("");
    setTexto("");
    setNumero("");
    setExtra("");
    setCantidad(1);
    if (sizes.length > 1) setTalla("");
    router.refresh();
  }

  async function remove(entry: Mine) {
    const res = await fetch(`/api/listas/${listId}/personas`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personaId: entry.id, token: entry.token }),
    });
    if (!res.ok && res.status !== 404) return;
    const next = mine.filter((m) => m.id !== entry.id);
    setMine(next);
    writeMine(listId, next);
    if (justAdded?.id === entry.id) setJustAdded(null);
    router.refresh();
  }

  if (closed) {
    return (
      <div className="rounded-brand border border-black/10 bg-paper-soft p-5 text-center text-sm text-ink-soft">
        El organizador ya cerró esta lista. Si te faltó anotarte, escríbele directamente.
      </div>
    );
  }

  return (
    <div className="rounded-brand border border-black/10 bg-white p-5 shadow-sm">
      {justAdded && (
        <div className="mb-4 rounded-brand bg-ink p-4 text-paper">
          <p className="font-semibold">¡Listo, {justAdded.nombre}!</p>
          <p className="mt-0.5 text-sm text-paper/70">
            Quedaste anotado con talla {justAdded.talla}
            {justAdded.texto
              ? `, y tu camisa dirá «${justAdded.texto}»${justAdded.numero ? ` con el ${justAdded.numero}` : ""}`
              : justAdded.numero
                ? `, con el número ${justAdded.numero}`
                : ""}
            {justAdded.extra ? ` y «${justAdded.extra}»` : ""}
            {justAdded.cantidad > 1 ? ` (${justAdded.cantidad} piezas)` : ""}. Puedes anotar a alguien más aquí abajo.
          </p>
        </div>
      )}

      <p className="font-display text-3xl uppercase leading-none tracking-wide text-ink">{title}</p>

      {(hasDesign || personal) && (
        <div className="mt-4">
          <GroupShirtPreview
            category={category}
            colorHex={colorHex}
            designs={designs}
            personal={personal}
            valores={{ nombre: texto.trim(), numero, texto: extra.trim() }}
            propio={{ ...(eligen.fuente ? { fuente: miFuente } : {}), ...(eligen.color ? { color: miColor } : {}) }}
          />
          <p className="mt-1.5 text-center text-[11px] text-ink-muted">
            {personal
              ? forOthers
                ? "Así va a quedar su camisa: lo que escribas abajo aparece aquí."
                : "Así va a quedar tu camisa: escribe abajo lo tuyo y míralo aquí."
              : "Así va a quedar la camisa del grupo."}
          </p>
        </div>
      )}

      <label className="mt-4 block">
        <span className="text-xs font-semibold text-ink-soft">{forOthers ? "Nombre" : "Tu nombre"}</span>
        <input
          value={nombre}
          maxLength={60}
          onChange={(e) => setNombre(e.target.value)}
          placeholder={forOthers ? "Nombre de la persona" : "Tu nombre y apellido, para la lista"}
          className="input mt-1"
        />
      </label>

      {(withName || withNumber || withExtra) && (
        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-3">
            {withName && (
              <label className="block min-w-0 flex-1">
                <span className="block text-xs font-semibold text-ink-soft">
                  {forOthers ? "Lo que dirá su camisa" : "Lo que dirá tu camisa"}
                </span>
                <input
                  value={texto}
                  maxLength={MAX_TEXTO}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Nombre o apodo, ej. CHEPE"
                  className="input mt-1 font-semibold"
                />
                <span className="mt-1 block text-[11px] text-ink-muted">
                  Tal cual: mayúsculas, tildes y espacios salen como los escribas ({texto.length}/{MAX_TEXTO}).
                </span>
              </label>
            )}
            {withNumber && (
              <label className="block shrink-0">
                <span className="block text-xs font-semibold text-ink-soft">Número</span>
                <input
                  value={numero}
                  inputMode="numeric"
                  maxLength={MAX_NUMERO}
                  onChange={(e) => setNumero(e.target.value.replace(/\D/g, ""))}
                  placeholder="Ej. 10"
                  className="input mt-1 text-center font-semibold"
                  style={{ width: "6rem" }}
                />
              </label>
            )}
          </div>
          {withExtra && (
            <label className="block">
              <span className="block text-xs font-semibold text-ink-soft">{personal?.etiqueta}</span>
              <input
                value={extra}
                maxLength={MAX_EXTRA}
                onChange={(e) => setExtra(e.target.value)}
                className="input mt-1 font-semibold"
              />
            </label>
          )}
        </div>
      )}

      {personal && (eligen.fuente || eligen.color) && (
        <div className="mt-4 space-y-3 rounded-brand bg-paper-soft p-3">
          {eligen.fuente && (
            <div>
              <p className="text-xs font-semibold text-ink-soft">{forOthers ? "Letra de sus textos" : "Letra de tus textos"}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {NAME_FONTS.map((fuente) => {
                  const option = FONT_OPTIONS.find((o) => o.value === fuente);
                  return (
                    <button
                      key={fuente}
                      type="button"
                      onClick={() => setMiFuente(fuente)}
                      aria-pressed={miFuente === fuente}
                      title={option?.label}
                      className={`h-9 rounded-brand border px-3 text-sm transition-colors ${
                        miFuente === fuente ? "border-ink bg-ink text-paper" : "border-black/15 bg-white text-ink hover:border-ink"
                      }`}
                      style={{ fontFamily: option?.cssVar, fontWeight: option?.weight }}
                    >
                      {(texto.trim() || numero || extra.trim() || "Texto").slice(0, 8)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {eligen.color && (
            <div>
              <p className="text-xs font-semibold text-ink-soft">{forOthers ? "Color de sus textos" : "Color de tus textos"}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {NAME_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setMiColor(c.hex)}
                    aria-label={c.name}
                    aria-pressed={miColor === c.hex}
                    title={c.name}
                    className={`h-8 w-8 rounded-full border-2 transition-transform ${
                      miColor === c.hex ? "scale-110 border-ink" : "border-black/10"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {sizes.length > 1 && (
        <fieldset className="mt-4">
          <div className="flex items-center justify-between gap-2">
            <legend className="text-xs font-semibold text-ink-soft">{forOthers ? "Talla" : "Tu talla"}</legend>
            <SizeChartButton category={category} productName={productName} />
          </div>
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTalla(s)}
                aria-pressed={talla === s}
                className={`rounded-brand border py-2.5 text-sm font-semibold transition-colors ${
                  talla === s ? "border-ink bg-ink text-paper" : "border-black/15 text-ink hover:border-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-ink-soft">¿Cuántas piezas?</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCantidad((n) => Math.max(1, n - 1))}
            aria-label="Una menos"
            className="h-9 w-9 rounded-brand border border-black/15 text-lg text-ink hover:border-ink"
          >
            −
          </button>
          <span className="w-8 text-center font-bold text-ink">{cantidad}</span>
          <button
            type="button"
            onClick={() => setCantidad((n) => Math.min(20, n + 1))}
            aria-label="Una más"
            className="h-9 w-9 rounded-brand border border-black/15 text-lg text-ink hover:border-ink"
          >
            +
          </button>
        </div>
      </div>

      {error && <p className="mt-3 rounded-brand bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button
        type="button"
        onClick={add}
        disabled={
          sending ||
          nombre.trim().length < 2 ||
          !talla ||
          (withName && !texto.trim()) ||
          (withNumber && !numero) ||
          (withExtra && !extra.trim())
        }
        className="mt-5 w-full rounded-brand bg-ink px-5 py-3 text-sm font-semibold text-paper hover:opacity-80 disabled:opacity-40"
      >
        {sending ? "Guardando…" : !talla ? "Elige la talla" : forOthers ? `Anotar con talla ${talla}` : `Anotarme con talla ${talla}`}
      </button>

      {mine.length > 0 && (
        <div className="mt-5 border-t border-black/10 pt-4">
          <p className="text-xs font-semibold text-ink-soft">Anotados desde este teléfono</p>
          <ul className="mt-2 space-y-1.5">
            {mine.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-ink">
                  {m.nombre} · <span className="font-semibold">{m.talla}</span>
                  {m.texto ? ` · «${m.texto}»` : ""}
                  {m.numero ? ` · #${m.numero}` : ""}
                  {m.extra ? ` · «${m.extra}»` : ""}
                  {m.cantidad > 1 ? ` × ${m.cantidad}` : ""}
                </span>
                <button type="button" onClick={() => remove(m)} className="text-xs font-semibold text-red-700 hover:underline">
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
