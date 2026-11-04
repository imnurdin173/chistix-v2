import type { NextConfig } from "next";

const API_URL = process.env.API_URL;
if (!API_URL) {
  throw new Error("API_URL belum diisi (Vercel → Settings → Environment Variables)");
}
if (!/\/api$/.test(API_URL)) {
  throw new Error(`API_URL harus diakhiri "/api", nilai sekarang: ${API_URL}`);
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;