import { readFileSync } from "node:fs";
import { join } from "node:path";

// Resolve prompts relative to the package root.
// Uses process.cwd() + known monorepo path since webpack mangles import.meta.url.
function resolvePrompt(filename: string): string {
  // In monorepo: packages/prompts/<filename> relative to workspace root.
  // This works both in dev (next dev) and production (next build) because
  // process.cwd() is always the web app root, and prompts is 2 levels up.
  const candidates = [
    join(process.cwd(), "../../packages/prompts", filename),
    join(process.cwd(), "../packages/prompts", filename),
    join(process.cwd(), "packages/prompts", filename),
  ];
  for (const p of candidates) {
    try { return readFileSync(p, "utf8"); } catch { /* try next */ }
  }
  throw new Error(`Prompt file not found: ${filename}. Searched: ${candidates.join(", ")}`);
}

export const PLANNER_PROMPT = resolvePrompt("planner.md");
export const EXECUTOR_SUMMARIZE_PROMPT = resolvePrompt("executor-summarize.md");
export const EXECUTOR_RESEARCH_PROMPT = resolvePrompt("executor-research.md");
export const EXECUTOR_EMAIL_PROMPT = resolvePrompt("executor-email.md");
export const EXECUTOR_TRANSLATE_PROMPT = resolvePrompt("executor-translate.md");
export const EXECUTOR_MEETING_PROMPT = resolvePrompt("executor-meeting.md");
