"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PRODUCTS, getProductById } from "@/lib/catalog";

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
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myLists, setMyLists] = useState<MyList[]>([]);
  const product = getProductById(productId) ?? PRODUCTS[0];

  useEffect(() => setMyLists(readMyLists()), []);

  async function create() {
    setSending(true);
    setError(null);
    const res = await fetch("/api/listas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, organizador, productId, color: color || null }),
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
