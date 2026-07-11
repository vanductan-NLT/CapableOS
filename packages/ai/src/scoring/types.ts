import type { PoolCandidate, RequiredCapability, ScoredCandidate } from "@orchestra/contracts";

export type { ScoredCandidate } from "@orchestra/contracts";

export interface ScoringWeights {
  match: number;
  trust: number;
}

export interface ScoreCandidatesInput {
  required: RequiredCapability[];
  candidates: PoolCandidate[];
  weights?: ScoringWeights;
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
