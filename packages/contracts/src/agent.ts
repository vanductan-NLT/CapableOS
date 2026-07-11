import type { Capability } from "./capabilities";

export interface PoolCandidate {
  id: string;
  type: "human" | "ai";
  name: string;
  trust: number;
  cost: number;
  minutes: number;
  caps: Partial<Record<Capability, number>>;
}
// [S] Shared contract — Capability Pool member. Derived from DB schema `agents` (Playbook mục 09).
// Founder B is primary author (owns the agents table). FR-13 manages this via POST/PATCH /agents.

export type AgentType = "human" | "ai";

/** {capability: proficiency 0..1} — ví dụ: { analysis: 0.9, writing: 0.7 } */
export type CapabilityMap = Record<string, number>;

export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  role?: string;
  trust: number; // 0..100 — giá trị dẫn xuất; nguồn sự thật là log feedback (FR-11)
  cost?: number; // ESTIMATED tới khi có log đối chiếu (FR-14)
  minutes?: number; // ESTIMATED
  caps: CapabilityMap;
  created_at: string;
}

/** Body cho POST /agents — id/trust/created_at do server sinh/mặc định. */
export type NewAgentInput = Omit<Agent, "id" | "created_at" | "trust"> & {
  trust?: number;
};

/** Body cho PATCH /agents/:id */
export type AgentPatch = Partial<Omit<Agent, "id" | "created_at">>;
