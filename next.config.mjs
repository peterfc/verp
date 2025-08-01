/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Temporarily disabled due to critters module issue
  // experimental: {
  //   optimizeCss: true,
  // },
}

export default nextConfig
