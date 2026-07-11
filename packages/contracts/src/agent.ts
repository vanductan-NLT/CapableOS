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
