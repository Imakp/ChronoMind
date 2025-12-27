import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
    // removeConsole: false,
  },

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: [
      // "@tiptap/react",
      // "@tiptap/starter-kit",
      "lucide-react",
    ],
  },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // Compression
  compress: true,

  // Production source maps (disable for smaller bundles)
  productionBrowserSourceMaps: false,
};

export default nextConfig;
