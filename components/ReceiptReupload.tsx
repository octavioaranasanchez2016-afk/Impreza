"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ACCEPTED_RECEIPT_TYPES, validateReceiptFile } from "@/lib/bank";

// En la página del pedido, cuando el pago fue rechazado: el cliente sube una foto
// nueva de su transferencia y el pedido vuelve a revisión.
export function ReceiptReupload({ orderId, orderCode }: { orderId: string; orderCode: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function choose(next: File | null) {
    setError(null);
    if (!next) return setFile(null);
    const problem = validateReceiptFile(next);
    if (problem) {
      setFile(null);
      setError(problem);
      return;
    }
    setFile(next);
  }

  async function submit() {
    if (!file) return;
    setSending(true);
    setError(null);
    try {
      const ext = file.type === "image/png" ? "png" : "jpg";
      const path = `comprobantes/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await createClient()
        .storage.from("comprobantes")
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw new Error("No se pudo subir la foto. Revisa tu conexión e intenta de nuevo.");

      const res = await fetch(`/api/pedidos/${orderId}/comprobante`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comprobantePath: path }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo enviar el comprobante.");
      }
      setSent(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el comprobante.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-brand border-2 border-ink bg-white p-5 text-center">
        <p className="font-semibold text-ink">¡Recibimos tu comprobante!</p>
        <p className="mt-1 text-sm text-ink-soft">Lo revisamos y te avisamos en cuanto verifiquemos el pago.</p>
      </div>
    );
  }

  return (
    <div id="comprobante" className="scroll-mt-24 rounded-brand border-2 border-red-600 bg-white p-5">
      <p className="font-semibold text-ink">Sube tu comprobante de nuevo</p>
      <p className="mt-1 text-sm text-ink-soft">
        Una foto o captura de la transferencia donde se vea el monto, la fecha y el código{" "}
        <span className="font-semibold text-ink">{orderCode}</span> en el concepto.
      </p>

      <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-brand border border-dashed border-black/20 p-3 hover:border-ink">
        {preview ? (
          <img src={preview} alt="Comprobante" className="h-20 w-20 rounded object-cover" />
        ) : (
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded bg-paper-soft text-2xl text-ink-muted">
            +
          </span>
        )}
        <span className="text-sm">
          <span className="font-semibold text-ink">{file ? file.name : "Adjuntar comprobante"}</span>
          <span className="block text-xs text-ink-soft">{file ? "Toca para cambiarlo" : "JPG o PNG, toca para elegir el archivo"}</span>
        </span>
        <input
          type="file"
          accept={ACCEPTED_RECEIPT_TYPES.join(",")}
          onChange={(e) => choose(e.target.files?.[0] ?? null)}
          className="sr-only"
        />
      </label>

      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={!file || sending}
        className="mt-4 w-full rounded-brand bg-ink px-5 py-3 text-sm font-semibold text-paper hover:opacity-80 disabled:opacity-40"
      >
        {sending ? "Enviando…" : "Enviar comprobante"}
      </button>
    </div>
  );
}
