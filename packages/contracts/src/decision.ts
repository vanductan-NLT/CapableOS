// [S] Shared contract — Playbook mục 08. Owned jointly; domain A is primary author.
// Founder B reads Decision (via decision_id) but MUST NOT redefine this shape.

export type Verdict = "human" | "ai" | "hybrid" | "escalate";
export type Risk = "low" | "high";

export interface RequiredCapability {
  cap: string;
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
