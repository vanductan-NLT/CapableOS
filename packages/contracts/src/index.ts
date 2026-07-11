// Barrel export của @orchestra/contracts — nguồn sự thật của mọi interface.
// packages/ai/planner và các slice khác import TỪ ĐÂY, không định nghĩa lại shape.

export {
  CAPABILITIES,
  CapabilitySchema,
  isCapability,
  assertValidCapability,
  assertValidCapabilities,
} from "./capabilities";
export type { Capability } from "./capabilities";

export type {
  Verdict,
  Risk,
  RequiredCapability,
  Candidate,
  Governance,
  Decision,
} from "./decision";

export type { PoolCandidate } from "./agent";
