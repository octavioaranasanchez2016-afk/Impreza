// El panel de admin es una experiencia separada del sitio público: sin
// Header/Footer/botón de WhatsApp del catálogo. El layout raíz sigue
// aportando <html>/<body> y las fuentes; este solo evita el "chrome" público.
export const metadata = {
  title: "Panel",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
