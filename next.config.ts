import type { NextConfig } from "next";

/**
 * Static export for GitHub Pages (user site mevdad.github.io → domain root,
 * so no basePath/assetPrefix). Everything is pre-rendered to `out/` at build
 * time: no server, no API routes, no middleware.
 */
const nextConfig: NextConfig = {
  output: "export",
  // GitHub Pages serves `/foo/index.html` for `/foo/` — trailing slashes keep
  // any future sub-route working without server rewrites.
  trailingSlash: true,
  // The image optimizer needs a server; with static export we ship images as-is.
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
