/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep 'export' for Firebase static hosting compatibility
  output: 'export',
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  trailingSlash: false,
  // Vercel will ignore this and use serverless when deployed
}

module.exports = nextConfig