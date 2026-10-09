import type { MetadataRoute } from "next";
import { PRODUCTS } from "@/lib/catalog";
import { siteUrl } from "@/lib/site";
import { getApprovedReviews } from "@/lib/reviews";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  // Reseñas, solo cuando ya hay alguna publicada.
  const { stats } = await getApprovedReviews(1).catch(() => ({ stats: { count: 0 } }));
  const pages = ["", "/catalogo", "/pedido", "/por-mayor", "/camisas-de-graduacion", "/uniformes-para-empresas", "/camisas-para-equipos", "/lista-de-tallas", "/preguntas-frecuentes", "/nosotros", "/seguimiento", ...(stats.count > 0 ? ["/resenas"] : []), "/terminos", "/privacidad"];
  return [
    ...pages.map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 })),
    ...PRODUCTS.map((p) => ({ url: `${base}/producto/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
