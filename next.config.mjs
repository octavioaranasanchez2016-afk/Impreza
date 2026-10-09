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
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
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
