import { CapabilitySchema } from "@orchestra/contracts";
import { z } from "zod";

export const RequiredCapabilitySchema = z.object({
  cap: CapabilitySchema,
  weight: z.number().min(0).max(1),
});

export const PlannerOutputSchema = z.object({
  required: z.array(RequiredCapabilitySchema).min(1),
  missing: z.array(z.string()),
  rationale: z.string(),
});

export type PlannerOutput = z.infer<typeof PlannerOutputSchema>;
