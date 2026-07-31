import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Next 16 treats a dev-resource request from any host other than the canonical
   * `localhost` as cross-origin and blocks it — including the client bundle. The
   * page still server-renders, so it looks completely normal and is dead to every
   * click. Lumen gets opened at 127.0.0.1 and across the LAN, so declare both.
   */
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.0.17", "turbo.local"],
};

export default nextConfig;
