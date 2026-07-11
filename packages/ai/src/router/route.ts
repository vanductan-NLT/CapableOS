import type { Risk } from "@orchestra/contracts";
import { DEFAULT_ROUTER_CONFIG, ROUTER_EPSILON } from "./config";
import { RouterError } from "./errors";
import type { RouteDecisionInput, RouteDecisionResult, RouterConfig } from "./types";
import type { ScoredCandidate, ScoringFailureReason, ScoringResult } from "../scoring";

const VALID_SCORING_FAILURE_REASONS = new Set<ScoringFailureReason>([
  "NO_REQUIRED_CAPABILITIES",
  "NO_CANDIDATES",
]);

export function routeDecision(input: RouteDecisionInput): RouteDecisionResult {
  const config = input.config ?? DEFAULT_ROUTER_CONFIG;

  validateRisk(input.risk);
  validateRouterConfig(config);
  validateScoringResult(input.scoring);

  if (!input.scoring.scorable) {
    return {
      verdict: "escalate",
      selectedCandidateIds: [],
      reasonCode: input.scoring.reason,
      ambiguity: null,
    };
  }

  const top = input.scoring.candidates[0];
  if (top.fit < config.minimumFit) {
    return withTop(input.scoring, {
      verdict: "escalate",
      selectedCandidateIds: [],
      reasonCode: "TOP_FIT_BELOW_THRESHOLD",
    });
  }

  if (isAmbiguous(input.scoring.ambiguity, config)) {
    return routeAmbiguous(input.scoring);
  }

  if (top.type === "human") {
    return withTop(input.scoring, {
      verdict: "human",
      selectedCandidateIds: [top.id],
      reasonCode: "TOP_CANDIDATE_HUMAN",
    });
  }

  if (input.risk === "low") {
    return withTop(input.scoring, {
      verdict: "ai",
      selectedCandidateIds: [top.id],
      reasonCode: "TOP_CANDIDATE_AI_LOW_RISK",
    });
  }

  const reviewer = input.scoring.candidates.find((candidate) => candidate.type === "human");
  if (reviewer === undefined) {
    return withTop(input.scoring, {
      verdict: "escalate",
      selectedCandidateIds: [],
      reasonCode: "NO_HUMAN_REVIEWER_AVAILABLE",
    });
  }

  return withTop(input.scoring, {
    verdict: "hybrid",
    selectedCandidateIds: [top.id, reviewer.id],
    reasonCode: "HIGH_RISK_AI_REQUIRES_HUMAN",
  });
}

function routeAmbiguous(scoring: Extract<ScoringResult, { scorable: true }>): RouteDecisionResult {
  const [first, second] = scoring.candidates;
  if (second === undefined) {
    throw new RouterError("Ambiguous scoring result requires at least two candidates");
  }

  if (first.type !== second.type) {
    const aiCandidate = first.type === "ai" ? first : second;
    const humanCandidate = first.type === "human" ? first : second;

    return withTop(scoring, {
      verdict: "hybrid",
      selectedCandidateIds: [aiCandidate.id, humanCandidate.id],
      reasonCode: "AMBIGUOUS_HUMAN_AI_HYBRID",
    });
  }

  return withTop(scoring, {
    verdict: "escalate",
    selectedCandidateIds: [],
    reasonCode: first.type === "human" ? "AMBIGUOUS_HUMAN_CANDIDATES" : "AMBIGUOUS_AI_CANDIDATES",
  });
}

function withTop(
  scoring: Extract<ScoringResult, { scorable: true }>,
  result: Omit<RouteDecisionResult, "topCandidateId" | "topFit" | "ambiguity">,
): RouteDecisionResult {
  const top = scoring.candidates[0];

  return {
    ...result,
    topCandidateId: top.id,
    topFit: top.fit,
    ambiguity: scoring.ambiguity,
  };
}

function isAmbiguous(ambiguity: number | null, config: RouterConfig): boolean {
  return ambiguity !== null && ambiguity < config.ambiguityThreshold;
}

function validateRisk(risk: Risk): void {
  if (risk !== "low" && risk !== "high") {
    throw new RouterError(`Invalid risk: expected "low" or "high", received ${String(risk)}`);
  }
}

function validateRouterConfig(config: RouterConfig): void {
  validateConfigValue(config.minimumFit, "minimumFit");
  validateConfigValue(config.ambiguityThreshold, "ambiguityThreshold");
}

function validateConfigValue(value: number, key: keyof RouterConfig): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RouterError(
      `Invalid router config "${key}": expected a finite number in 0..1, received ${String(
        value,
      )}`,
    );
  }
}

function validateScoringResult(scoring: ScoringResult): void {
  if (!scoring.scorable) {
    validateUnscorableResult(scoring);
    return;
  }

  validateScorableResult(scoring);
}

function validateUnscorableResult(scoring: Extract<ScoringResult, { scorable: false }>): void {
  if (scoring.candidates.length !== 0) {
    throw new RouterError("Invalid unscorable result: candidates must be empty");
  }

  if (scoring.ambiguity !== null) {
    throw new RouterError("Invalid unscorable result: ambiguity must be null");
  }

  if (!VALID_SCORING_FAILURE_REASONS.has(scoring.reason)) {
    throw new RouterError(`Invalid scoring failure reason: ${String(scoring.reason)}`);
  }
}

function validateScorableResult(scoring: Extract<ScoringResult, { scorable: true }>): void {
  if (scoring.candidates.length === 0) {
    throw new RouterError("Invalid scorable result: candidates must not be empty");
  }

  scoring.candidates.forEach(validateCandidate);
  validateRanking(scoring.candidates);
  validateAmbiguity(scoring);
}

function validateCandidate(candidate: ScoredCandidate): void {
  if (candidate.type !== "human" && candidate.type !== "ai") {
    throw new RouterError(
      `Invalid candidate type for "${candidate.id}": received ${String(candidate.type)}`,
    );
  }

  if (!Number.isFinite(candidate.fit) || candidate.fit < 0 || candidate.fit > 1) {
    throw new RouterError(
      `Invalid fit for candidate "${candidate.id}": expected finite 0..1, received ${String(
        candidate.fit,
      )}`,
    );
  }
}

function validateRanking(candidates: ScoredCandidate[]): void {
  for (let index = 1; index < candidates.length; index += 1) {
    const previous = candidates[index - 1];
    const current = candidates[index];

    if (current.fit - previous.fit > ROUTER_EPSILON) {
      throw new RouterError(
        `Invalid candidate ranking: candidate "${current.id}" has higher fit than "${previous.id}"`,
      );
    }
  }
}

function validateAmbiguity(scoring: Extract<ScoringResult, { scorable: true }>): void {
  if (scoring.candidates.length === 1) {
    if (scoring.ambiguity !== null) {
      throw new RouterError("Invalid ambiguity: single-candidate results must use null");
    }

    return;
  }

  if (
    scoring.ambiguity === null ||
    !Number.isFinite(scoring.ambiguity) ||
    scoring.ambiguity < 0 ||
    scoring.ambiguity > 1
  ) {
    throw new RouterError(
      `Invalid ambiguity: expected finite 0..1 for multi-candidate results, received ${String(
        scoring.ambiguity,
      )}`,
    );
  }

  const expectedAmbiguity = Math.max(0, scoring.candidates[0].fit - scoring.candidates[1].fit);
  if (Math.abs(scoring.ambiguity - expectedAmbiguity) > ROUTER_EPSILON) {
    throw new RouterError(
      `Invalid ambiguity: expected top fit delta ${expectedAmbiguity}, received ${scoring.ambiguity}`,
    );
  }
}
