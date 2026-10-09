// De dónde puede cargar cosas el sitio (Content Security Policy). Si alguien lograra
// meter un script en la página, no podría traer código de otro lado ni mandar datos
// a otro servidor. Solo: este sitio, Supabase (archivos), Unsplash (fotos), Google Maps
// (el mapa del taller) y Vercel (estadísticas y la barra de las vistas previas).
const isDev = process.env.NODE_ENV !== "production";
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "https://*.supabase.co";
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com https://vercel.live`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabase} https://images.unsplash.com https://vercel.live https://vercel.com`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabase} https://va.vercel-scripts.com https://vercel.live wss://ws-us3.pusher.com${isDev ? " ws: wss:" : ""}`,
  "frame-src https://www.google.com https://maps.google.com https://vercel.live",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  // Seguridad en el navegador, en todas las páginas:
  // - solo por https; nadie puede meter el sitio dentro de otro (clickjacking);
  // - el navegador no adivina tipos de archivo; no se pasa la dirección completa a otros sitios;
  // - cámara y micrófono apagados; la ubicación solo para el mapa de entrega.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // El panel empieza en los pedidos (si no hay sesión, ahí mismo pide entrar).
      { source: "/admin", destination: "/admin/pedidos", permanent: false },
      // admin.imprezani.com abre directo el panel.
      {
        source: "/",
        has: [{ type: "host", value: "admin.imprezani.com" }],
        destination: "/admin/pedidos",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
