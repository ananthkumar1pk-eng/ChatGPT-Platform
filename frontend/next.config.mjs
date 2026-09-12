/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  ...(process.env.NEXT_EXPORT === "true" ? { output: "export" } : {}),
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;



