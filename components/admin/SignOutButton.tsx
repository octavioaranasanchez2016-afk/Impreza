"use client";

import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/admin/salir", { method: "POST" }).catch(() => null);
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="rounded-brand border border-paper/20 px-3 py-1.5 text-xs font-semibold text-paper transition-colors hover:bg-paper hover:text-ink"
    >
      Cerrar sesión
    </button>
  );
}
