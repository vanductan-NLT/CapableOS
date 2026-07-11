import { CAPABILITIES, type RequiredCapability, type Risk } from "@orchestra/contracts";
import { PLANNER_PROMPT } from "@orchestra/prompts";
import { generateObject, type LanguageModel } from "ai";
import { normalizeCapabilities } from "../capability";
import { PlannerOutputSchema } from "./schema";
import { fallbackExtract } from "./fallback";
import { classifyRisk } from "./risk";

const TIMEOUT_MS = 25_000;
const TEMPERATURE = 0.2;

export interface PlanInput {
  title: string;
  description?: string;
}

export interface PlanResult {
  required: RequiredCapability[];
  risk: Risk;
}

export interface PlanOptions {
  model: LanguageModel;
  timeoutMs?: number;
  log?: (event: PlannerLogEvent) => void;
}

export type PlannerLogEvent =
  | {
      source: "llm";
      missing: string[];
      rationale: string;
    }
  | {
      source: "fallback";
      error: string;
    };

export async function plan(input: PlanInput, options: PlanOptions): Promise<PlanResult> {
  const risk = classifyRisk(input);

  try {
    const result = await generateObject({
      model: options.model,
      schema: PlannerOutputSchema,
      temperature: TEMPERATURE,
      system: PLANNER_PROMPT,
      prompt: buildUserPrompt(input),
      abortSignal: AbortSignal.timeout(options.timeoutMs ?? TIMEOUT_MS),
    });

    options.log?.({
      source: "llm",
      missing: result.object.missing,
      rationale: result.object.rationale,
    });

    return {
      required: normalizeCapabilities(result.object.required),
      risk,
    };
  } catch (error) {
    options.log?.({
      source: "fallback",
      error: stringifyError(error),
    });
  }

  const fallbackRequired = fallbackExtract(input);
  if (fallbackRequired.length === 0) {
    return {
      required: [],
      risk: "high",
    };
  }

  try {
    return {
      required: normalizeCapabilities(fallbackRequired),
      risk: "high",
    };
  } catch (error) {
    options.log?.({
      source: "fallback",
      error: stringifyError(error),
    });

    return {
      required: [],
      risk: "high",
    };
  }
}

function buildUserPrompt(input: PlanInput): string {
  return JSON.stringify({
    title: input.title,
    description: input.description,
    known_capabilities: CAPABILITIES,
  });
}

function stringifyError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
