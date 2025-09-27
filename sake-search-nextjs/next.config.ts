import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb', // Server Actionのボディサイズ制限を2MBに拡張
    },
  },
};

export default nextConfig;
