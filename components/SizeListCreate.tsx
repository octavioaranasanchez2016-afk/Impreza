"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PRODUCTS, getProductById } from "@/lib/catalog";
import { Lugares, camposDe, defaultLugares, parseLugares, personalizadoDe } from "@/lib/group-names";
import { LugaresPicker } from "./LugaresPicker";
import { NamePreview } from "./NamePreview";

// Las listas que este teléfono creó, para volver a ellas sin buscar el enlace.
export const MY_LISTS_KEY = "impreza-mis-listas";
export interface MyList {
  id: string;
  clave: string;
  nombre: string;
}

export function readMyLists(): MyList[] {
  try {
    const raw = localStorage.getItem(MY_LISTS_KEY);
    return raw ? (JSON.parse(raw) as MyList[]) : [];
  } catch {
    return [];
  }
}

export function SizeListCreate() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [organizador, setOrganizador] = useState("");
  const [productId, setProductId] = useState(PRODUCTS[0].id);
  const [color, setColor] = useState("");
  // Si cada camisa lleva algo de su dueño, y qué va en cada lugar (pecho, espalda, mangas).
  const [personalizada, setPersonalizada] = useState(true);
  const [lugaresElegidos, setLugares] = useState<Lugares>({ espalda: "nombre" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myLists, setMyLists] = useState<MyList[]>([]);
  const product = getProductById(productId) ?? PRODUCTS[0];
  // Al cambiar de prenda se quitan los lugares que no tiene (un hoodie no lleva mangas).
  const fitted = parseLugares(lugaresElegidos, product.category);
  const lugares = Object.keys(fitted).length > 0 ? fitted : defaultLugares("nombre", product.category);
  const campos = camposDe(personalizadoDe(lugares));
  const previewHex = product.variants.find((v) => v.color === color)?.colorHex ?? product.variants[0]?.colorHex ?? "#FFFFFF";

  useEffect(() => setMyLists(readMyLists()), []);

  async function create() {
    setSending(true);
    setError(null);
    const res = await fetch("/api/listas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, organizador, productId, color: color || null, lugares: personalizada ? lugares : {} }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "No se pudo crear la lista.");
      setSending(false);
      return;
    }
    try {
      localStorage.setItem(MY_LISTS_KEY, JSON.stringify([{ id: data.id, clave: data.clave, nombre }, ...readMyLists()].slice(0, 20)));
    } catch {
      // Sin almacenamiento: el enlace del organizador sigue funcionando.
    }
    router.push(`/lista-de-tallas/${data.id}?clave=${encodeURIComponent(data.clave)}`);
  }

  return (
    <div className="rounded-brand border border-black/10 bg-white p-5 shadow-sm md:p-6">
      <p className="font-display text-3xl uppercase leading-none tracking-wide text-ink">Crea tu lista</p>

      <label className="mt-5 block">
        <span className="text-xs font-semibold text-ink-soft">Nombre del grupo</span>
        <input
          value={nombre}
          maxLength={60}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Promoción 2026 — Colegio La Salle"
          className="input mt-1"
        />
      </label>
      <label className="mt-4 block">
        <span className="text-xs font-semibold text-ink-soft">Tu nombre (opcional)</span>
        <input
          value={organizador}
          maxLength={60}
          onChange={(e) => setOrganizador(e.target.value)}
          placeholder="Para que el grupo sepa quién organiza"
          className="input mt-1"
        />
      </label>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-ink-soft">Prenda</span>
          <select
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              setColor("");
            }}
            className="input mt-1"
          >
            {PRODUCTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-ink-soft">Color</span>
          <select value={color} onChange={(e) => setColor(e.target.value)} className="input mt-1">
            <option value="">Lo decidimos después</option>
            {product.variants.map((v) => (
              <option key={v.color} value={v.color}>
                {v.color}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="text-xs font-semibold text-ink-soft">¿Cada camisa lleva el nombre o el número de su dueño?</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[
            { on: false, label: "Todas iguales", hint: "Nadie lleva su nombre" },
            { on: true, label: "Personalizadas", hint: "Cada quien con lo suyo" },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => setPersonalizada(o.on)}
              aria-pressed={personalizada === o.on}
              className={`rounded-brand border px-3 py-2.5 text-left transition-colors ${
                personalizada === o.on ? "border-ink bg-ink text-paper" : "border-black/15 text-ink hover:border-ink"
              }`}
            >
              <span className="block text-sm font-semibold">{o.label}</span>
              <span className={`block text-[11px] ${personalizada === o.on ? "text-paper/70" : "text-ink-soft"}`}>{o.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {personalizada && (
        <div className="mt-4 rounded-brand bg-paper-soft p-3 md:p-4">
          <p className="text-sm font-semibold text-ink">¿Qué va y dónde?</p>
          <p className="mt-0.5 text-xs text-ink-soft">Tú decides: solo el pecho, pecho y mangas, o todo. Toca lo que lleva cada lugar.</p>
          <div className="mt-3">
            <LugaresPicker category={product.category} value={lugares} onChange={setLugares} />
          </div>
          <div className="mt-3">
            <NamePreview category={product.category} colorHex={previewHex} texto="CHEPE" numero="10" style={{ lugares }} />
            <p className="mt-1 text-center text-[10px] text-ink-muted">Ejemplo con «CHEPE» y el 10</p>
          </div>
          <p className="mt-3 text-[11px] text-ink-soft">
            Cada quien escribe{" "}
            <span className="font-semibold text-ink">
              {campos.nombre && campos.numero ? "su nombre y su número" : campos.numero ? "su número" : "su nombre o apodo"}
            </span>{" "}
            tal como quiere que salga en su camisa. Tú no tienes que pasarlo a mano.
          </p>
        </div>
      )}

      {error && <p className="mt-3 rounded-brand bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button
        type="button"
        onClick={create}
        disabled={sending || nombre.trim().length < 3}
        className="mt-5 w-full rounded-brand bg-ink px-5 py-3 text-sm font-semibold text-paper hover:opacity-80 disabled:opacity-40"
      >
        {sending ? "Creando…" : "Crear lista y obtener el enlace"}
      </button>
      <p className="mt-2 text-center text-[11px] text-ink-muted">Gratis y sin cuenta. Nadie paga nada por anotarse.</p>

      {myLists.length > 0 && (
        <div className="mt-5 border-t border-black/10 pt-4">
          <p className="text-xs font-semibold text-ink-soft">Tus listas en este teléfono</p>
          <ul className="mt-2 space-y-1.5">
            {myLists.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/lista-de-tallas/${l.id}?clave=${encodeURIComponent(l.clave)}`}
                  className="text-sm font-semibold text-ink underline"
                >
                  {l.nombre} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
