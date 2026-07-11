import type { Capability } from "./capabilities";

export type Verdict = "human" | "ai" | "hybrid" | "escalate";
export type Risk = "low" | "high";

export interface RequiredCapability {
  /**
   * Feature 0: siết từ `string` → `Capability` (literal union chung).
   * Runtime không đổi (jsonb `decisions.required` vẫn lưu string); chỉ ép ở compile-time.
   */
  cap: Capability;
  weight: number;
}

export interface Candidate {
  id: string;
  type: "human" | "ai";
  name: string;
  match: number; // 0..1 độ khớp năng lực
  fit: number; // 0..1 = 0.7*match + 0.3*trust
  cost: number;
  minutes: number;
}

export interface ScoredCandidate extends Candidate {
  trust: number; // 0..100
  normalizedTrust: number; // 0..1
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

export interface Governance {
  allow: string[];
  deny: string[];
  approval: string[];
}

export interface Decision {
  task_id: string;
  required: RequiredCapability[];
  risk: Risk;
  candidates: Candidate[]; // đã xếp hạng theo fit giảm dần
  verdict: Verdict;
  chosen: string[]; // id ứng viên được chọn
  confidence: number; // = fit(chosen), THẬT
  ambiguity: number; // fit#1 − fit#2
  reasoning: string;
  governance: Governance;
  estimated: boolean; // cost/time chưa validate?
}

export interface StructuredDecisionReason {
  code: RouterReasonCode;
  selected_candidate_ids: string[];
  top_candidate_id?: string;
  top_fit?: number;
  ambiguity: number | null;
}

export interface DecisionPersistenceInput {
  task_id: string;
  required: RequiredCapability[];
  risk: Risk;
  candidates: ScoredCandidate[];
  verdict: Verdict;
  chosen: string[];
  confidence: number | null;
  ambiguity: number | null;
  reason: StructuredDecisionReason;
  reasoning: string;
  governance: null;
  cost_est: number | null;
  minutes_est: number | null;
  estimated: true;
}

export interface DecisionResponse extends DecisionPersistenceInput {
  id: string;
  created_at: string;
}
