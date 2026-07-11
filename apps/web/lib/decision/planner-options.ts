import { createOpenAI } from "@ai-sdk/openai";
import type { PlanOptions } from "@orchestra/ai";
import { qwenApiKey, qwenBaseUrl, qwenModel } from "../env";

export class QwenPlannerConfigError extends Error {
  constructor() {
    super("Qwen planner configuration is missing or invalid");
    this.name = "QwenPlannerConfigError";
  }
}

export function createQwenPlannerOptions(): PlanOptions {
  try {
    const qwenProvider = createOpenAI({
      apiKey: qwenApiKey(),
      baseURL: qwenBaseUrl(),
    });

    return {
      model: qwenProvider(qwenModel()),
    };
  } catch {
    throw new QwenPlannerConfigError();
  }
}
