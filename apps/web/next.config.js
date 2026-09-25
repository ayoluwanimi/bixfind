/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    deviceSizes: [640, 750, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  trailingSlash: false,
  compress: true,
  poweredByHeader: false,
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: [],
  },
  async redirects() {
    return [
      { source: "/auth/login", destination: "/login", permanent: true },
      { source: "/auth/signup", destination: "/signup", permanent: true },
    ]
  },
}

module.exports = nextConfig