// run.mjs — apply migrations / seed against a Postgres (Supabase) connection.
// Usage: node scripts/run.mjs <migrate|seed|reset>
// Requires env DATABASE_URL (Supabase → Project Settings → Database → Connection string,
// dùng connection pooler hoặc direct; cần quyền tạo bảng nên dùng direct/service).
//
// Không có DATABASE_URL → script in hướng dẫn và thoát 1 (không giả vờ thành công).

import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_DIR = join(__dirname, "..");
const MIGRATIONS_DIR = join(DB_DIR, "migrations");

const cmd = process.argv[2];
const url = process.env.DATABASE_URL;

if (!url) {
  console.error(
    "✗ Thiếu DATABASE_URL.\n" +
      "  Supabase → Project Settings → Database → Connection string (direct).\n" +
      "  Ví dụ: DATABASE_URL=postgres://postgres:<pwd>@db.<ref>.supabase.co:5432/postgres node scripts/run.mjs migrate",
  );
  process.exit(1);
}

async function withClient(fn) {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function runMigrations(client) {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    const sql = await readFile(join(MIGRATIONS_DIR, f), "utf8");
    process.stdout.write(`→ ${f} ... `);
    await client.query(sql);
    console.log("ok");
  }
}

async function runSeed(client) {
  const sql = await readFile(join(DB_DIR, "seed.sql"), "utf8");
  process.stdout.write("→ seed.sql ... ");
  await client.query(sql);
  console.log("ok");
}

async function runReset(client) {
  process.stdout.write("→ drop schema public cascade ... ");
  await client.query("drop schema if exists public cascade; create schema public;");
  console.log("ok");
}

const actions = {
  migrate: (c) => runMigrations(c),
  seed: (c) => runSeed(c),
  reset: async (c) => {
    await runReset(c);
    await runMigrations(c);
    await runSeed(c);
  },
};

if (!actions[cmd]) {
  console.error("Usage: node scripts/run.mjs <migrate|seed|reset>");
  process.exit(1);
}

withClient(actions[cmd])
  .then(() => console.log("✓ done"))
  .catch((e) => {
    console.error("✗ failed:", e.message);
    process.exit(1);
  });
