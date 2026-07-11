import type { PoolCandidate, RequiredCapability } from "@orchestra/contracts";

export interface ScoringWeights {
  match: number;
  trust: number;
}

export interface ScoreCandidatesInput {
  required: RequiredCapability[];
  candidates: PoolCandidate[];
  weights?: ScoringWeights;
}

export interface ScoredCandidate {
  id: string;
  type: "human" | "ai";
  name: string;
  trust: number;
  normalizedTrust: number;
  cost: number;
  minutes: number;
  match: number;
  fit: number;
}

export type ScoringFailureReason = "NO_REQUIRED_CAPABILITIES" | "NO_CANDIDATES";

export type ScoringResult =
  | {
      scorable: true;
      candidates: ScoredCandidate[];
      ambiguity: number | null;
    }
  | {
      scorable: false;
      candidates: [];
      ambiguity: null;
      reason: ScoringFailureReason;
    };
