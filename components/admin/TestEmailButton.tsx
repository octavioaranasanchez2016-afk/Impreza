"use client";

import { useState } from "react";

// Prueba el correo de avisos de pedidos nuevos y muestra qué pasó.
export function TestEmailButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function run() {
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/admin/correo-prueba", { method: "POST" });
    const body = await res.json().catch(() => ({ ok: false, message: "No se pudo probar el correo." }));
    setLoading(false);
    setResult(body);
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="rounded-brand border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink disabled:opacity-50"
      >
        {loading ? "Enviando..." : "Probar correo de avisos"}
      </button>
      {result && (
        <p className={`max-w-sm text-xs ${result.ok ? "text-green-700" : "font-medium text-red-700"}`}>{result.message}</p>
      )}
    </div>
  );
}
