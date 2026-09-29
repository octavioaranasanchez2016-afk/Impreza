import type { MetadataRoute } from "next";
import { PRODUCTS } from "@/lib/catalog";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const pages = ["", "/catalogo", "/pedido", "/por-mayor", "/preguntas-frecuentes", "/nosotros", "/seguimiento", "/resenas", "/privacidad"];
  return [
    ...pages.map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 })),
    ...PRODUCTS.map((p) => ({ url: `${base}/producto/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
