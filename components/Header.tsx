"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

// wideOnly: en pantallas medianas no cabe; se muestra desde lg y siempre en el menú del celular.
const NAV_LINKS: { href: string; label: string; wideOnly?: boolean }[] = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/por-mayor", label: "Por mayor", wideOnly: true },
  { href: "/seguimiento", label: "Rastrear pedido" },
  { href: "/nosotros", label: "Quiénes somos" },
  { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo/impreza-wordmark.png"
            alt="Impreza"
            width={613}
            height={160}
            priority
            className="h-6 w-auto md:h-7"
          />
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-ink md:flex lg:gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`border-b-2 py-1 transition-colors ${link.wideOnly ? "hidden lg:inline-block" : ""} ${
                pathname.startsWith(link.href) ? "border-ink" : "border-transparent hover:border-ink/30"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/pedido"
            className="rounded-brand bg-ink px-4 py-2 text-sm font-semibold text-paper transition-opacity hover:opacity-80"
          >
            Hacer pedido
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menú"
            className="flex h-9 w-9 items-center justify-center rounded-brand border border-black/10 md:hidden"
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-black/5 bg-paper px-4 py-3 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block py-2.5 text-base text-ink ${pathname.startsWith(link.href) ? "font-bold" : "font-medium"}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}

      <div className="h-1 brand-stripe" />
    </header>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
      {open ? (
        <path d="M5 5l10 10M15 5 5 15" strokeLinecap="round" />
      ) : (
        <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
      )}
    </svg>
  );
}
