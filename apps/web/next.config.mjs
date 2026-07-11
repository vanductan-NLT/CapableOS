/** @type {import('next').NextConfig} */
const nextConfig = {
  // Workspace packages are shipped as raw TS source → let Next transpile them.
  transpilePackages: ["@orchestra/contracts", "@orchestra/ai"],
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
