import { describe, expect, it } from "vitest";
import type { DecisionPersistenceInput, DecisionResponse } from "@orchestra/contracts";
import {
  DecisionRepositoryError,
  ROUTE_DECISION_RPC,
  persistRouteDecision,
  type DecisionRpcClient,
} from "./repository";

const taskId = "9a06c23e-1c6e-4b2a-9a61-51b8f8f7ff30";

const persistenceInput: DecisionPersistenceInput = {
  task_id: taskId,
  required: [{ cap: "summarization", weight: 1 }],
  risk: "low",
  candidates: [
    {
      id: "ai-summarize",
      type: "ai",
      name: "Summarizer",
      trust: 80,
      normalizedTrust: 0.8,
      cost: 0.3,
      minutes: 1,
      match: 0.9,
      fit: 0.87,
    },
  ],
  verdict: "ai",
  chosen: ["ai-summarize"],
  confidence: null,
  ambiguity: null,
  reason: {
    code: "TOP_CANDIDATE_AI_LOW_RISK",
    selected_candidate_ids: ["ai-summarize"],
    top_candidate_id: "ai-summarize",
    top_fit: 0.87,
    ambiguity: null,
  },
  reasoning: "The top candidate was an AI agent and the task was low risk.",
  governance: null,
  cost_est: 0.3,
  minutes_est: 1,
  estimated: true,
};

const decisionRow: DecisionResponse = {
  ...persistenceInput,
  id: "0ef906bb-5107-480b-b612-1c38bd7a2b36",
  created_at: "2026-07-12T00:00:00.000Z",
};

describe("persistRouteDecision", () => {
  it("calls the RPC without duplicating task_id inside p_decision", async () => {
    const client = rpcClient({ status: "created", decision: decisionRow });

    await persistRouteDecision(client, persistenceInput);

    expect(client.calls).toEqual([
      {
        name: ROUTE_DECISION_RPC,
        args: {
          p_task_id: taskId,
          p_decision: expect.not.objectContaining({ task_id: taskId }),
        },
      },
    ]);
  });

  it("returns created decisions", async () => {
    const result = await persistRouteDecision(
      rpcClient({ status: "created", decision: decisionRow }),
      persistenceInput,
    );

    expect(result).toEqual({ kind: "created", decision: decisionRow });
  });

  it("returns existing decisions without treating them as errors", async () => {
    const result = await persistRouteDecision(
      rpcClient({ status: "existing", decision: decisionRow }),
      persistenceInput,
    );

    expect(result).toEqual({ kind: "existing", decision: decisionRow });
  });

  it("maps missing tasks to not_found repository errors", async () => {
    await expect(persistRouteDecision(rpcClient({ status: "not_found" }), persistenceInput)).rejects.toMatchObject({
      code: "not_found",
    });
  });

  it("maps invalid task status to conflict repository errors", async () => {
    await expect(
      persistRouteDecision(rpcClient({ status: "conflict", task_status: "executing" }), persistenceInput),
    ).rejects.toMatchObject({
      code: "conflict",
    });
  });

  it("maps DB RPC failures to technical internal_error", async () => {
    await expect(
      persistRouteDecision(rpcClient(null, { message: "database unavailable" }), persistenceInput),
    ).rejects.toMatchObject({
      code: "internal_error",
      message: "database unavailable",
    });
  });

  it("rejects invalid RPC result shapes as technical internal_error", async () => {
    await expect(
      persistRouteDecision(rpcClient({ status: "created", decision: { ...decisionRow, verdict: "maybe" } }), persistenceInput),
    ).rejects.toMatchObject({
      code: "internal_error",
      message: "Invalid decision RPC result shape",
    });
  });

  it("rejects malformed existing decision rows before casting", async () => {
    await expect(
      persistRouteDecision(rpcClient({ status: "existing", decision: { ...decisionRow, reason: null } }), persistenceInput),
    ).rejects.toBeInstanceOf(DecisionRepositoryError);
  });
});

function rpcClient(
  data: unknown,
  error: { message: string; code?: string } | null = null,
): DecisionRpcClient & { calls: Array<{ name: string; args: Record<string, unknown> }> } {
  return {
    calls: [],
    async rpc(name, args) {
      this.calls.push({ name, args });
      return { data, error };
    },
  };
}
