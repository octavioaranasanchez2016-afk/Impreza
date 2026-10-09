// Datos para Google (JSON-LD) dentro de <script>. Se escapa "<" para que ningún texto
// pueda cerrar la etiqueta y meter otra cosa en la página.
export function jsonLdHtml(data: unknown): { __html: string } {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
