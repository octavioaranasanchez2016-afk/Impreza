"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/finca", label: "Resumen" },
  { href: "/admin/finca/movimientos", label: "Ingresos y gastos" },
  { href: "/admin/finca/inventario", label: "Inventario" },
  { href: "/admin/finca/trabajadores", label: "Trabajadores y pagos" },
  { href: "/admin/finca/cultivos", label: "Cultivos" },
];

export function FincaNav() {
  const pathname = usePathname();
  return (
    <nav className="-mx-1 mb-6 flex gap-1 overflow-x-auto border-b border-black/10 pb-3 print:hidden">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${
            pathname === t.href ? "bg-ink text-paper" : "text-ink-soft hover:bg-white"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
