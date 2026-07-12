import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

// Load env from monorepo root — only need ONE .env.local at root level.
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env.local") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Workspace packages are shipped as raw TS source → let Next transpile them.
  transpilePackages: ["@orchestra/contracts", "@orchestra/ai", "@orchestra/prompts"],
  reactStrictMode: true,
  // @orchestra/prompts previously used fs.readFileSync — now inlined as string literals.
  // No longer needs serverExternalPackages.

  // ── Windows stability: reduce .next cache corruption ──────
  // Use filesystem cache with longer intervals to reduce write contention.
  onDemandEntries: {
    // Keep pages in memory longer (default 15s is too aggressive on Windows)
    maxInactiveAge: 120 * 1000,
    // More pages in memory = fewer disk writes
    pagesBufferLength: 5,
  },
};

export default nextConfig;
