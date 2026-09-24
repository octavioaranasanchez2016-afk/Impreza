import Link from "next/link";
import { WhatsAppLinkButton } from "./WhatsAppButton";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-black/5 bg-ink text-paper">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
        <div>
          <p className="text-lg font-semibold">impreza</p>
          <p className="mt-2 text-sm text-paper/70">
            Diseños personalizados en Managua, Nicaragua. Camisas, hoodies y tote bags con tu diseño.
          </p>
        </div>

        <div className="text-sm text-paper/70">
          <p className="font-semibold text-paper">Contacto</p>
          <WhatsAppLinkButton
            message="Hola, quiero más información sobre Impreza."
            className="mt-2 inline-block hover:text-paper"
          >
            Escríbenos por WhatsApp
          </WhatsAppLinkButton>
          <a
            href="https://www.google.com/maps/search/?api=1&query=4PCW%2BPM5+Managua"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block hover:text-paper"
          >
            Arango Textil, Managua
          </a>
        </div>

        <div className="text-sm text-paper/70">
          <p className="font-semibold text-paper">Horario</p>
          <p className="mt-2">Lun – Vie: 8am – 5pm</p>
          <p>Sábado: 8am – 12pm</p>
          <p>Domingo: Cerrado</p>
        </div>

        <div className="text-sm text-paper/70">
          <p className="font-semibold text-paper">Explorar</p>
          <Link href="/catalogo" className="mt-2 block hover:text-paper">
            Catálogo
          </Link>
          <Link href="/nosotros" className="mt-1 block hover:text-paper">
            Quiénes somos
          </Link>
          <Link href="/preguntas-frecuentes" className="mt-1 block hover:text-paper">
            Preguntas frecuentes
          </Link>
        </div>
      </div>
      <div className="h-1 brand-stripe" />
    </footer>
  );
}
