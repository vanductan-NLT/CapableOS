import { z } from "zod";
import {
  CapabilitySchema,
  type ApiErrorCode,
  type DecisionPersistenceInput,
  type DecisionResponse,
} from "@orchestra/contracts";
import { decisionRowToResponse } from "./mapper";

const TASK_STATUSES = [
  "created",
  "routed",
  "executing",
  "awaiting_approval",
  "awaiting_human",
  "review",
  "done",
  "rejected",
] as const;

export const ROUTE_DECISION_RPC = "route_decision_transaction";

type SupabaseRpcResult = {
  data: unknown;
  error: { message: string; code?: string } | null;
};

type SupabaseSingleResult = {
  data: unknown;
  error: { message: string; code?: string } | null;
};

export interface DecisionRpcClient {
  rpc(name: string, args: Record<string, unknown>): Promise<SupabaseRpcResult>;
}

export interface DecisionReadClient {
  from(table: "decisions"): {
    select(columns: string): {
      eq(column: "id", value: string): {
        maybeSingle(): Promise<SupabaseSingleResult>;
      };
    };
  };
}

export type DecisionRepositoryClient = DecisionRpcClient & DecisionReadClient;

export type PersistRouteDecisionResult =
  | { kind: "created"; decision: DecisionResponse }
  | { kind: "existing"; decision: DecisionResponse };

export class DecisionRepositoryError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DecisionRepositoryError";
  }
}

export function createDecisionRepository(client: DecisionRepositoryClient) {
  return {
    persistRouteDecision(input: DecisionPersistenceInput) {
      return persistRouteDecision(client, input);
    },
    getDecisionById(id: string) {
      return getDecisionById(client, id);
    },
  };
}

export async function getDecisionById(
  client: DecisionReadClient,
  id: string,
): Promise<DecisionResponse | null> {
  const { data, error } = await client.from("decisions").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new DecisionRepositoryError("internal_error", error.message);
  }

  if (data === null) {
    return null;
  }

  return decisionRowToResponse(parseDecisionRow(data));
}

export async function persistRouteDecision(
  client: DecisionRpcClient,
  input: DecisionPersistenceInput,
): Promise<PersistRouteDecisionResult> {
  const { data, error } = await client.rpc(ROUTE_DECISION_RPC, {
    p_task_id: input.task_id,
    p_decision: decisionPayload(input),
  });

  if (error) {
    throw new DecisionRepositoryError("internal_error", error.message);
  }

  const result = parseRpcResult(data);

  switch (result.status) {
    case "created":
      return { kind: "created", decision: decisionRowToResponse(result.decision) };
    case "existing":
      return { kind: "existing", decision: decisionRowToResponse(result.decision) };
    case "not_found":
      throw new DecisionRepositoryError("not_found", `Task ${input.task_id} was not found`);
    case "conflict":
      throw new DecisionRepositoryError(
        "conflict",
        `Task ${input.task_id} cannot be routed from status ${result.task_status}`,
      );
  }
}

function decisionPayload(input: DecisionPersistenceInput): Omit<DecisionPersistenceInput, "task_id"> {
  return {
    required: input.required,
    risk: input.risk,
    candidates: input.candidates,
    verdict: input.verdict,
    chosen: input.chosen,
    confidence: input.confidence,
    ambiguity: input.ambiguity,
    reason: input.reason,
    reasoning: input.reasoning,
    governance: input.governance,
    cost_est: input.cost_est,
    minutes_est: input.minutes_est,
    estimated: input.estimated,
  };
}

function parseRpcResult(data: unknown): RouteDecisionRpcResult {
  const parsed = routeDecisionRpcResultSchema.safeParse(data);
  if (!parsed.success) {
    throw new DecisionRepositoryError("internal_error", "Invalid decision RPC result shape");
  }

  return parsed.data;
}

function parseDecisionRow(data: unknown): DecisionRowFromRpc {
  const parsed = decisionRowSchema.safeParse(data);
  if (!parsed.success) {
    throw new DecisionRepositoryError("internal_error", "Invalid decision row shape");
  }

  return parsed.data;
}

const verdictSchema = z.enum(["human", "ai", "hybrid", "escalate"]);
const riskSchema = z.enum(["low", "high"]);
const candidateTypeSchema = z.enum(["human", "ai"]);
const reasonCodeSchema = z.enum([
  "NO_REQUIRED_CAPABILITIES",
  "NO_CANDIDATES",
  "TOP_FIT_BELOW_THRESHOLD",
  "AMBIGUOUS_HUMAN_AI_HYBRID",
  "AMBIGUOUS_HUMAN_CANDIDATES",
  "AMBIGUOUS_AI_CANDIDATES",
  "TOP_CANDIDATE_HUMAN",
  "TOP_CANDIDATE_AI_LOW_RISK",
  "HIGH_RISK_AI_REQUIRES_HUMAN",
  "NO_HUMAN_REVIEWER_AVAILABLE",
]);

const requiredCapabilitySchema = z.object({
  cap: CapabilitySchema,
  weight: z.number().min(0).max(1),
});

const scoredCandidateSchema = z.object({
  id: z.string().min(1),
  type: candidateTypeSchema,
  name: z.string(),
  trust: z.number().min(0).max(100),
  normalizedTrust: z.number().min(0).max(1),
  cost: z.number().min(0),
  minutes: z.number().min(0),
  match: z.number().min(0).max(1),
  fit: z.number().min(0).max(1),
});

const structuredDecisionReasonSchema = z.object({
  code: reasonCodeSchema,
  selected_candidate_ids: z.array(z.string()),
  top_candidate_id: z.string().optional(),
  top_fit: z.number().min(0).max(1).optional(),
  ambiguity: z.number().min(0).max(1).nullable(),
});

const decisionRowSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  required: z.array(requiredCapabilitySchema),
  risk: riskSchema,
  candidates: z.array(scoredCandidateSchema),
  verdict: verdictSchema,
  chosen: z.array(z.string()),
  confidence: z.number().min(0).max(1).nullable(),
  ambiguity: z.number().min(0).max(1).nullable(),
  reason: structuredDecisionReasonSchema,
  reasoning: z.string(),
  governance: z.null(),
  cost_est: z.number().min(0).nullable(),
  minutes_est: z.number().min(0).nullable(),
  estimated: z.literal(true),
  created_at: z.string(),
});

const taskStatusSchema = z.enum(TASK_STATUSES);

const routeDecisionRpcResultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("created"),
    decision: decisionRowSchema,
  }),
  z.object({
    status: z.literal("existing"),
    decision: decisionRowSchema,
  }),
  z.object({
    status: z.literal("not_found"),
  }),
  z.object({
    status: z.literal("conflict"),
    task_status: taskStatusSchema,
  }),
]);

type DecisionRowFromRpc = z.infer<typeof decisionRowSchema>;
type RouteDecisionRpcResult = z.infer<typeof routeDecisionRpcResultSchema>;
