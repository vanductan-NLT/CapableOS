import { readFileSync } from "node:fs";

export const PLANNER_PROMPT = readFileSync(
  new URL("../planner.md", import.meta.url),
  "utf8",
);
