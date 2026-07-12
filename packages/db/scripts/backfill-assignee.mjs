// Backfill tasks.assignee_id from decisions.chosen[0]
import { config } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", "..", "..", ".env.local") });

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const res = await client.query(`
  UPDATE tasks t
  SET assignee_id = (d.chosen ->> 0)
  FROM decisions d
  WHERE t.decision_id = d.id
    AND t.assignee_id IS NULL
    AND d.chosen IS NOT NULL
    AND d.chosen <> '[]'::jsonb
`);

console.log("Updated rows:", res.rowCount);
await client.end();
