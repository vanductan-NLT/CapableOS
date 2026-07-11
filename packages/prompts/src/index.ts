import { readFileSync } from "node:fs";

export const PLANNER_PROMPT = readFileSync(
  new URL("../planner.md", import.meta.url),
  "utf8",
);

export const EXECUTOR_SUMMARIZE_PROMPT = readFileSync(
  new URL("../executor-summarize.md", import.meta.url),
  "utf8",
);

export const EXECUTOR_RESEARCH_PROMPT = readFileSync(
  new URL("../executor-research.md", import.meta.url),
  "utf8",
);

export const EXECUTOR_EMAIL_PROMPT = readFileSync(
  new URL("../executor-email.md", import.meta.url),
  "utf8",
);

export const EXECUTOR_TRANSLATE_PROMPT = readFileSync(
  new URL("../executor-translate.md", import.meta.url),
  "utf8",
);

export const EXECUTOR_MEETING_PROMPT = readFileSync(
  new URL("../executor-meeting.md", import.meta.url),
  "utf8",
);
