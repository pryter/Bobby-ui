import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bobby CI is archived: its old docs pages fold into one page.
  async redirects() {
    return [{ source: "/docs/bobby-ci/:path*", destination: "/docs/archived/bobby-ci", permanent: false }];
  },
};

export default nextConfig;
