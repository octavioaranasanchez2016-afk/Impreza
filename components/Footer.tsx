import Link from "next/link";
import { WhatsAppLinkButton } from "./WhatsAppButton";

export function Footer() {
  return (
    <footer className="border-t border-paper/10 bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-16 md:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="font-display text-6xl uppercase leading-none tracking-wide">Impreza</p>
            <p className="mt-3 max-w-xs text-sm text-paper/70">
              Camisas, hoodies y tote bags con tu diseño. Serigrafía y sublimado en Managua, Nicaragua.
            </p>
            <WhatsAppLinkButton
              message="Hola, quiero más información sobre Impreza."
              className="mt-5 inline-block rounded-brand bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Escríbenos por WhatsApp
            </WhatsAppLinkButton>
          </div>

          <FooterColumn title="Explorar">
            <Link href="/catalogo" className="block hover:text-paper">
              Catálogo
            </Link>
            <Link href="/pedido" className="block hover:text-paper">
              Hacer pedido
            </Link>
            <Link href="/nosotros" className="block hover:text-paper">
              Quiénes somos
            </Link>
            <Link href="/preguntas-frecuentes" className="block hover:text-paper">
              Preguntas frecuentes
            </Link>
          </FooterColumn>

          <FooterColumn title="Visítanos">
            <a
              href="https://www.google.com/maps/search/?api=1&query=4PCW%2BPM5+Managua"
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:text-paper"
            >
              Arango Textil, Managua ↗
            </a>
            <p>Lun – Vie: 8am – 5pm</p>
            <p>Sábado: 8am – 12pm</p>
            <p>Domingo: cerrado</p>
          </FooterColumn>

          <FooterColumn title="Pagos y entregas">
            <p>Transferencia BAC</p>
            <p>Córdobas o dólares</p>
            <p>Listo en 7 días hábiles</p>
            <p>Desde 1 pieza</p>
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-paper/15 pt-6 text-xs text-paper/50 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Impreza. Hecho en Managua, Nicaragua.</p>
          <p>Serigrafía · Sublimado · Diseño a escala real</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 text-sm text-paper/70">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-paper">{title}</p>
      {children}
    </div>
  );
}
