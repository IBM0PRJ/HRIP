/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  optimizeFonts: false,
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  }
};

export default nextConfig;

