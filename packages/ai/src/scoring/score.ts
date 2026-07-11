import {
  CapabilitySchema,
  isCapability,
  type Capability,
  type PoolCandidate,
  type RequiredCapability,
} from "@orchestra/contracts";
import { DEFAULT_SCORING_WEIGHTS, SCORE_EPSILON } from "./config";
import { ScoringError } from "./errors";
import type { ScoredCandidate, ScoreCandidatesInput, ScoringResult, ScoringWeights } from "./types";

export function scoreCandidates(input: ScoreCandidatesInput): ScoringResult {
  const weights = input.weights ?? DEFAULT_SCORING_WEIGHTS;
  validateScoringWeights(weights);

  if (input.required.length === 0) {
    return {
      scorable: false,
      candidates: [],
      ambiguity: null,
      reason: "NO_REQUIRED_CAPABILITIES",
    };
  }

  if (input.candidates.length === 0) {
    return {
      scorable: false,
      candidates: [],
      ambiguity: null,
      reason: "NO_CANDIDATES",
    };
  }

  validateRequiredCapabilities(input.required);
  input.candidates.forEach(validateCandidate);

  const totalRequiredWeight = input.required.reduce((sum, item) => sum + item.weight, 0);
  if (totalRequiredWeight <= 0) {
    throw new ScoringError("Total required capability weight must be greater than 0");
  }

  const candidates = input.candidates
    .map((candidate) => scoreCandidate(candidate, input.required, totalRequiredWeight, weights))
    .sort(compareScoredCandidates);

  return {
    scorable: true,
    candidates,
    ambiguity:
      candidates.length >= 2 ? Math.max(0, candidates[0]!.fit - candidates[1]!.fit) : null,
  };
}

function scoreCandidate(
  candidate: PoolCandidate,
  required: RequiredCapability[],
  totalRequiredWeight: number,
  weights: ScoringWeights,
): ScoredCandidate {
  const match =
    required.reduce((sum, item) => sum + item.weight * (candidate.caps[item.cap] ?? 0), 0) /
    totalRequiredWeight;
  const normalizedTrust = candidate.trust / 100;
  const fit = weights.match * match + weights.trust * normalizedTrust;

  return {
    id: candidate.id,
    type: candidate.type,
    name: candidate.name,
    trust: candidate.trust,
    normalizedTrust,
    cost: candidate.cost,
    minutes: candidate.minutes,
    match,
    fit,
  };
}

function compareScoredCandidates(a: ScoredCandidate, b: ScoredCandidate): number {
  if (Math.abs(b.fit - a.fit) > SCORE_EPSILON) {
    return b.fit - a.fit;
  }

  if (Math.abs(b.match - a.match) > SCORE_EPSILON) {
    return b.match - a.match;
  }

  return a.id.localeCompare(b.id);
}

function validateScoringWeights(weights: ScoringWeights): void {
  validateWeightComponent(weights.match, "match");
  validateWeightComponent(weights.trust, "trust");

  if (Math.abs(weights.match + weights.trust - 1) > SCORE_EPSILON) {
    throw new ScoringError(
      `Invalid scoring weights: match + trust must equal 1, received ${weights.match + weights.trust}`,
    );
  }
}

function validateWeightComponent(value: number, key: keyof ScoringWeights): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new ScoringError(
      `Invalid scoring weight "${key}": expected a finite non-negative number, received ${String(value)}`,
    );
  }
}

function validateRequiredCapabilities(required: RequiredCapability[]): void {
  required.forEach((item, index) => {
    const parsedCap = CapabilitySchema.safeParse(item.cap);
    if (!parsedCap.success) {
      throw new ScoringError(
        `Invalid required capability at index ${index}: received ${JSON.stringify(item.cap)}`,
      );
    }

    if (!Number.isFinite(item.weight) || item.weight <= 0 || item.weight > 1) {
      throw new ScoringError(
        `Invalid required weight at index ${index}: expected > 0 and <= 1, received ${String(
          item.weight,
        )}`,
      );
    }
  });
}

function validateCandidate(candidate: PoolCandidate): void {
  validateTrust(candidate);

  for (const [cap, score] of Object.entries(candidate.caps)) {
    if (!isCapability(cap)) {
      throw new ScoringError(
        `Invalid capability key for candidate "${candidate.id}": "${cap}" is not in the capability taxonomy`,
      );
    }

    validateCapabilityScore(candidate.id, cap, score);
  }
}

function validateTrust(candidate: PoolCandidate): void {
  if (!Number.isFinite(candidate.trust) || candidate.trust < 0 || candidate.trust > 100) {
    throw new ScoringError(
      `Invalid trust for candidate "${candidate.id}": expected 0..100, received ${String(
        candidate.trust,
      )}`,
    );
  }
}

function validateCapabilityScore(candidateId: string, cap: Capability, score: number): void {
  if (!Number.isFinite(score) || score < 0 || score > 1) {
    throw new ScoringError(
      `Invalid capability score for candidate "${candidateId}", capability "${cap}": expected 0..1, received ${String(
        score,
      )}`,
    );
  }
}
