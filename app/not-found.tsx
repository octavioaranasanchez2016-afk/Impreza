import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Página no encontrada",
};

// El not-found raíz no hereda el layout del sitio: se arma con su propio header y footer.
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-24 text-center md:px-6">
        <p className="font-display text-[9rem] leading-none tracking-wide text-ink/10 md:text-[12rem]">404</p>
        <h1 className="-mt-6 font-display text-5xl uppercase leading-none tracking-wide text-ink md:text-6xl">
          Esta página no existe
        </h1>
        <p className="mx-auto mt-4 max-w-md text-ink-soft">
          Puede que el enlace esté mal escrito o que la página se haya movido. Si buscas tu pedido, rastréalo con tu
          código.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-brand bg-ink px-6 py-3 text-sm font-semibold text-paper hover:opacity-80">
            Ir al inicio
          </Link>
          <Link
            href="/seguimiento"
            className="rounded-brand border border-ink/20 px-6 py-3 text-sm font-semibold text-ink hover:border-ink"
          >
            Rastrear pedido
          </Link>
          <Link
            href="/catalogo"
            className="rounded-brand border border-ink/20 px-6 py-3 text-sm font-semibold text-ink hover:border-ink"
          >
            Ver catálogo
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
