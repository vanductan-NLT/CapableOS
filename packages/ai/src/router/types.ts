import type { Risk, RouterReasonCode, Verdict } from "@orchestra/contracts";
import type { ScoringResult } from "../scoring";

export type { RouterReasonCode } from "@orchestra/contracts";

export interface RouterConfig {
  minimumFit: number;
  ambiguityThreshold: number;
}

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
