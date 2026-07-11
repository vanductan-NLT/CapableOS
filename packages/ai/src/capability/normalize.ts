import { CapabilitySchema, type RequiredCapability } from "@orchestra/contracts";
import { ZodError } from "zod";

export class CapabilityNormalizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CapabilityNormalizationError";
  }
}

export function normalizeCapabilities(required: RequiredCapability[]): RequiredCapability[] {
  if (required.length === 0) {
    throw new CapabilityNormalizationError("Required capabilities must not be empty");
  }

  const merged = new Map<string, number>();
  const orderedCaps: string[] = [];

  required.forEach((item, index) => {
    const cap = parseCapability(item.cap, index);
    const weight = parseWeight(item.weight, index);

    if (weight === 0) {
      return;
    }

    if (!merged.has(cap)) {
      orderedCaps.push(cap);
      merged.set(cap, weight);
      return;
    }

    merged.set(cap, merged.get(cap)! + weight);
  });

  if (orderedCaps.length === 0) {
    throw new CapabilityNormalizationError("Required capabilities must contain at least one positive weight");
  }

  const total = orderedCaps.reduce((sum, cap) => sum + (merged.get(cap) ?? 0), 0);
  if (total === 0) {
    throw new CapabilityNormalizationError("Total capability weight must be greater than 0");
  }

  return orderedCaps.map((cap) => ({
    cap: CapabilitySchema.parse(cap),
    weight: (merged.get(cap) ?? 0) / total,
  }));
}

function parseCapability(cap: string, index: number) {
  try {
    return CapabilitySchema.parse(cap);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new CapabilityNormalizationError(`Invalid capability at index ${index}: ${String(cap)}`);
    }

    throw error;
  }
}

function parseWeight(weight: number, index: number): number {
  if (!Number.isFinite(weight) || weight < 0 || weight > 1) {
    throw new CapabilityNormalizationError(
      `Invalid weight at index ${index}: weight must be finite and between 0 and 1`,
    );
  }

  return weight;
}
