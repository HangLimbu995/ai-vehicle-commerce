/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsHmrCache: false, // Defaults to true3
    viewTransition: true,
    serverActions: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "twvzvlrfjlaozeiofltx.supabase.co",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/embed",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-src 'self' https://roadsidecoder.created.app;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
