import Link from "next/link";
import { PRODUCTS } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 md:px-6 md:pb-24 md:pt-20">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <p className="inline-block rounded-full border border-ink/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink">
              Managua, Nicaragua
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-ink md:text-6xl">
              Tu diseño,
              <br />
              impreso como debe ser.
            </h1>
            <p className="mt-5 max-w-md text-base text-ink-soft md:text-lg">
              Sube tu diseño, elige producto, talla y técnica — nosotros nos
              encargamos del resto. Desde 1 camisa hasta pedidos por mayor.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/pedido"
                className="rounded-brand bg-ink px-6 py-3 text-sm font-semibold text-paper transition-opacity hover:opacity-80"
              >
                Empezar mi pedido
              </Link>
              <Link
                href="/catalogo"
                className="rounded-brand border border-ink/15 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
              >
                Ver catálogo
              </Link>
            </div>
          </div>

          <div className="relative aspect-square w-full overflow-hidden rounded-brand shadow-sm ring-1 ring-black/5">
            <img
              src="https://images.unsplash.com/photo-1643216674491-33878507b402?w=900&q=80&auto=format&fit=crop"
              alt="Proceso de serigrafía en Impreza"
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-4 left-4 rounded-brand bg-white/95 px-4 py-3 backdrop-blur">
              <img src="/logo/impreza-icon.png" alt="" className="h-8 w-auto" />
            </div>
          </div>
        </div>
      </section>

      <section id="tecnicas" className="border-y border-black/5 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="text-2xl font-bold text-ink md:text-3xl">Técnicas de impresión</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-brand border border-black/5 p-6">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Serigrafía
              </span>
              <p className="mt-2 text-ink-soft">
                Ideal para diseños de 1-3 colores y pedidos grandes: entre más
                piezas, más económico por unidad.
              </p>
            </div>
            <div className="rounded-brand border border-black/5 p-6">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Sublimado
              </span>
              <p className="mt-2 text-ink-soft">
                Perfecto para diseños a todo color y fotografías, con acabado
                que no se agrieta ni se despega.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold text-ink md:text-3xl">Productos</h2>
          <Link href="/catalogo" className="text-sm font-semibold text-ink hover:underline">
            Ver todo
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="border-t border-black/5 bg-white py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2 md:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Quiénes somos</p>
            <h2 className="mt-2 text-2xl font-bold text-ink md:text-3xl">
              Una marca nicaragüense fundada en 2026
            </h2>
            <p className="mt-4 text-ink-soft">
              Impreza nace de una idea simple: que acceder a diseños
              personalizados de calidad sea sencillo para cualquiera. Sencillez,
              atención y facilidad — así trabajamos cada pedido.
            </p>
            <Link
              href="/nosotros"
              className="mt-6 inline-block text-sm font-semibold text-ink hover:underline"
            >
              Conoce nuestra historia →
            </Link>
          </div>
          <div className="aspect-[4/3] overflow-hidden rounded-brand">
            <img
              src="https://images.unsplash.com/photo-1456456496250-d5e7c0a9b44d?w=900&q=80&auto=format&fit=crop"
              alt="Impreza — proceso de impresión"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section id="como-funciona" className="border-t border-black/5 bg-paper py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="text-2xl font-bold text-ink md:text-3xl">Cómo funciona</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-4">
            {[
              ["1", "Sube tu diseño", "PNG, JPG o PDF, en buena resolución."],
              ["2", "Elige producto", "Talla, color, cantidad y técnica."],
              ["3", "Confirma tu pedido", "Te contactamos por WhatsApp para coordinar pago y entrega."],
              ["4", "Recíbelo listo", "Sigue el estado de tu pedido hasta la entrega."],
            ].map(([n, title, text]) => (
              <li key={n} className="rounded-brand border border-black/5 p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-bold text-paper">
                  {n}
                </span>
                <p className="mt-3 font-semibold text-ink">{title}</p>
                <p className="mt-1 text-sm text-ink-soft">{text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-sm text-ink-soft">
            ¿Tienes dudas sobre tiempos, mínimos o formas de pago?{" "}
            <Link href="/preguntas-frecuentes" className="font-semibold text-ink hover:underline">
              Ver preguntas frecuentes
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
