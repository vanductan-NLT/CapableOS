/** @type {import('next').NextConfig} */
const nextConfig = {
  // packages/contracts is shipped as raw TS source → let Next transpile it.
  transpilePackages: ["@orchestra/contracts"],
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
