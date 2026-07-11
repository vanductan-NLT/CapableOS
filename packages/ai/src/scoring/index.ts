export { DEFAULT_SCORING_WEIGHTS, SCORE_EPSILON } from "./config";
export { ScoringError } from "./errors";
export { scoreCandidates } from "./score";
export type {
  ScoredCandidate,
  ScoreCandidatesInput,
  ScoringFailureReason,
  ScoringResult,
  ScoringWeights,
} from "./types";
