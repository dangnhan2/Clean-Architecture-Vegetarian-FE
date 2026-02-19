import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: "/**"
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: "/**"
      },
    ],
  },
};

export default nextConfig;
