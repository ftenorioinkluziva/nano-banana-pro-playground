/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // For Docker deployment
  skipTrailingSlashRedirect: true, // Prevent 307 redirects on webhooks
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'generativelanguage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  staticPageGenerationTimeout: 120, // Increase timeout for static generation
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'sonner'],
  },
}

export default nextConfig
