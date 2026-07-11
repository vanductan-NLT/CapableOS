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
  // @orchestra/prompts uses fs.readFileSync + import.meta.url to load .md files.
  // Webpack mangles import.meta.url → must run natively in Node, not bundled.
  // @orchestra/ai must also be external because it transitively imports prompts.
  serverExternalPackages: ["@orchestra/prompts", "@orchestra/ai"],
};

export default nextConfig;
