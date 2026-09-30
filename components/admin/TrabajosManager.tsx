"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Trabajo {
  path: string;
  url: string;
  titulo: string;
}

const MAX_SIDE = 1600;

// Las fotos del celular pesan varios MB: se achican a 1600 px (JPEG) antes de subir,
// así la página de inicio carga rápido. Si el navegador no la puede leer, va tal cual.
async function shrink(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  return blob ? new File([blob], "foto.jpg", { type: "image/jpeg" }) : file;
}

export function TrabajosManager({ trabajos }: { trabajos: Trabajo[] }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [titulo, setTitulo] = useState("");
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  async function upload() {
    setError(null);
    for (let i = 0; i < files.length; i++) {
      setProgress(`Subiendo ${i + 1} de ${files.length}…`);
      const form = new FormData();
      form.append("foto", await shrink(files[i]));
      form.append("titulo", titulo);
      const res = await fetch("/api/admin/trabajos", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "No se pudo subir la foto.");
        setProgress(null);
        router.refresh();
        return;
      }
    }
    setProgress(null);
    setFiles([]);
    setTitulo("");
    router.refresh();
  }

  async function remove(path: string) {
    setError(null);
    const res = await fetch("/api/admin/trabajos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
    setConfirming(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo eliminar la foto.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="rounded-brand border border-black/10 bg-white p-5">
        <p className="font-semibold text-ink">Subir fotos</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="block">
            <span className="text-xs font-semibold text-ink-soft">Fotos</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              className="mt-1 block w-full text-sm text-ink file:mr-3 file:rounded-brand file:border-0 file:bg-ink file:px-3 file:py-2 file:text-sm file:font-semibold file:text-paper"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-ink-soft">Título (opcional)</span>
            <input
              value={titulo}
              maxLength={80}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Camisas de graduación, serigrafía"
              className="input mt-1"
            />
          </label>
          <button
            type="button"
            onClick={upload}
            disabled={files.length === 0 || progress !== null}
            className="rounded-brand bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:opacity-80 disabled:opacity-40"
          >
            {progress ?? (files.length > 1 ? `Subir ${files.length} fotos` : "Subir foto")}
          </button>
        </div>
        {error && <p className="mt-3 rounded-brand bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </div>

      {trabajos.length === 0 ? (
        <p className="mt-6 rounded-brand border border-dashed border-black/15 bg-white p-8 text-center text-sm text-ink-soft">
          Todavía no hay fotos. La sección «Trabajos recientes» del inicio aparece sola cuando subas la primera.
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {trabajos.map((t, i) => (
            <li key={t.path} className="overflow-hidden rounded-brand border border-black/10 bg-white">
              <div className="relative">
                <img src={t.url} alt={t.titulo || "Trabajo"} loading="lazy" className="aspect-square w-full object-cover" />
                {i < 8 && (
                  <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-semibold text-paper">
                    En el inicio
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 p-2.5">
                <p className="min-w-0 truncate text-xs text-ink-soft">{t.titulo || "Sin título"}</p>
                {confirming === t.path ? (
                  <span className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => remove(t.path)} className="rounded bg-red-600 px-2 py-1 text-[11px] font-semibold text-white">
                      Sí, borrar
                    </button>
                    <button type="button" onClick={() => setConfirming(null)} className="rounded border border-black/15 px-2 py-1 text-[11px]">
                      No
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(t.path)}
                    className="shrink-0 text-[11px] font-semibold text-red-700 hover:underline"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
