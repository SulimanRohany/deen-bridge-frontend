/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React Strict Mode to prevent WebSocket double-mounting issues
  reactStrictMode: false,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      // Add production domain when you deploy
      // {
      //   protocol: 'https',
      //   hostname: 'your-production-domain.com',
      //   pathname: '/media/**',
      // },
    ],
  },
  // Enable experimental features if needed
  experimental: {
    // Add any experimental features you want to use
  },
  // Configure webpack if needed
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
