import type { Risk, Verdict } from "@orchestra/contracts";
import type { ScoringResult } from "../scoring";

export interface RouterConfig {
  minimumFit: number;
  ambiguityThreshold: number;
}

export type RouterReasonCode =
  | "NO_REQUIRED_CAPABILITIES"
  | "NO_CANDIDATES"
  | "TOP_FIT_BELOW_THRESHOLD"
  | "AMBIGUOUS_HUMAN_AI_HYBRID"
  | "AMBIGUOUS_HUMAN_CANDIDATES"
  | "AMBIGUOUS_AI_CANDIDATES"
  | "TOP_CANDIDATE_HUMAN"
  | "TOP_CANDIDATE_AI_LOW_RISK"
  | "HIGH_RISK_AI_REQUIRES_HUMAN"
  | "NO_HUMAN_REVIEWER_AVAILABLE";

export interface RouteDecisionInput {
  risk: Risk;
  scoring: ScoringResult;
  config?: RouterConfig;
}

export interface RouteDecisionResult {
  verdict: Verdict;
  selectedCandidateIds: string[];
  reasonCode: RouterReasonCode;
  topCandidateId?: string;
  topFit?: number;
  ambiguity: number | null;
}
