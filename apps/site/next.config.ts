import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Vercel/Netlify/GitHub Pages
  // Remove this if you need server-side rendering
  // output: 'export',
  
  // Allow importing markdown files
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  
  // Images optimization
  images: {
    unoptimized: false,
  },
};

export default nextConfig;
