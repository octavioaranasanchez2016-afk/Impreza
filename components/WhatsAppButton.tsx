"use client";

import { usePathname } from "next/navigation";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "50588888888";

function buildWhatsAppUrl(message: string) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}

export function WhatsAppFloatingButton() {
  // En /pedido sube en el celular para no tapar la barra del total.
  const raised = usePathname() === "/pedido";
  const url = buildWhatsAppUrl(
    "Hola, quiero hacer una consulta sobre un pedido en Impreza."
  );

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      className={`fixed right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 md:right-8 lg:bottom-8 ${
        raised ? "bottom-32" : "bottom-5 md:bottom-8"
      }`}
    >
      <WhatsAppIcon />
    </a>
  );
}

export function WhatsAppLinkButton({
  message,
  className,
  children,
}: {
  message: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={buildWhatsAppUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden="true">
      <path d="M16.004 3C9.376 3 4 8.373 4 15c0 2.42.71 4.673 1.933 6.566L4 29l7.62-1.898A11.94 11.94 0 0 0 16.004 27C22.632 27 28 21.627 28 15S22.632 3 16.004 3Zm0 21.7c-2.02 0-3.89-.59-5.47-1.61l-.392-.246-4.52 1.126 1.208-4.404-.256-.406A9.65 9.65 0 0 1 5.3 15c0-5.907 4.797-10.7 10.704-10.7S26.708 9.093 26.708 15 21.911 24.7 16.004 24.7Zm5.86-8.017c-.32-.16-1.9-.937-2.194-1.044-.294-.107-.508-.16-.722.16-.213.32-.828 1.044-1.015 1.258-.187.213-.374.24-.694.08-.32-.16-1.35-.497-2.572-1.586-.95-.847-1.592-1.894-1.779-2.214-.187-.32-.02-.493.14-.653.144-.143.32-.373.48-.56.16-.187.213-.32.32-.533.107-.213.053-.4-.027-.56-.08-.16-.722-1.74-.99-2.383-.26-.626-.526-.541-.722-.55l-.615-.011c-.213 0-.56.08-.854.4-.293.32-1.12 1.093-1.12 2.667s1.147 3.093 1.307 3.307c.16.213 2.256 3.443 5.466 4.827.764.33 1.36.527 1.825.674.767.244 1.464.21 2.016.127.615-.092 1.9-.777 2.168-1.527.267-.75.267-1.393.187-1.527-.08-.133-.293-.213-.613-.373Z" />
    </svg>
  );
}
