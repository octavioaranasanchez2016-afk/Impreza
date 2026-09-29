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
