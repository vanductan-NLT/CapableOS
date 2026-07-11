import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

// Load env from monorepo root — only need ONE .env.local at root level.
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env.local") });

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
