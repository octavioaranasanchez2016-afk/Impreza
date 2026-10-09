"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Se entra en el servidor: la sesión queda en cookies que el navegador no puede leer.
    const res = await fetch("/api/admin/entrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).catch(() => null);
    if (!res?.ok) {
      const body = await res?.json().catch(() => null);
      setError(body?.error ?? "No hay conexión. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    // Después de la contraseña, el código del celular.
    router.push("/admin/verificacion");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-brand bg-white p-8 shadow-lg"
      >
        <Logo className="text-[26px]" />
        <h1 className="mt-6 text-xl font-bold text-ink">Panel de administración</h1>
        <p className="mt-1 text-sm text-ink-soft">Entra con tu correo y contraseña.</p>

        <label className="mt-6 block text-sm">
          <span className="mb-1 block font-medium text-ink-soft">Correo</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </label>

        <label className="mt-4 block text-sm">
          <span className="mb-1 block font-medium text-ink-soft">Contraseña</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </label>

        {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-brand bg-ink px-4 py-3 text-sm font-semibold text-paper transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
