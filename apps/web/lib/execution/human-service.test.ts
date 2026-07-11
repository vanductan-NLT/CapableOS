import { describe, expect, it, vi } from "vitest";
import {
  HumanServiceError,
  submitHumanResult,
  reviewHybridExecution,
  type HumanServiceDeps,
  type SubmitRpcResult,
  type ReviewRpcResult,
} from "./human-service";

// ── Fixtures ────────────────────────────────────────────────

function makeDeps(overrides?: Partial<HumanServiceDeps>): HumanServiceDeps {
  return {
    submitHumanResultRpc: vi.fn(),
    reviewHybridExecutionRpc: vi.fn(),
    ...overrides,
  };
}

// ── submitHumanResult ───────────────────────────────────────

describe("submitHumanResult", () => {
  it("returns success when RPC returns submitted", async () => {
    const rpcResult: SubmitRpcResult = {
      status: "submitted",
      execution: { id: "exec-001", task_id: "task-001" },
    };
    const deps = makeDeps({
      submitHumanResultRpc: vi.fn().mockResolvedValue(rpcResult),
    });

    const result = await submitHumanResult("exec-001", "human-alice", "My result", deps);

    expect(result).toEqual({
      execution_id: "exec-001",
      task_id: "task-001",
      status: "succeeded",
      task_status: "done",
    });
    expect(deps.submitHumanResultRpc).toHaveBeenCalledWith("exec-001", "human-alice", "My result");
  });

  it("returns success on idempotent re-submit (already_submitted)", async () => {
    const rpcResult: SubmitRpcResult = {
      status: "already_submitted",
      execution: { id: "exec-001", task_id: "task-001" },
    };
    const deps = makeDeps({
      submitHumanResultRpc: vi.fn().mockResolvedValue(rpcResult),
    });

    const result = await submitHumanResult("exec-001", "human-alice", "My result", deps);

    expect(result.execution_id).toBe("exec-001");
    expect(result.status).toBe("succeeded");
    expect(result.task_status).toBe("done");
  });

  it("throws not_found when execution does not exist", async () => {
    const deps = makeDeps({
      submitHumanResultRpc: vi.fn().mockResolvedValue({ status: "not_found" }),
    });

    await expect(submitHumanResult("exec-999", "human-alice", "output", deps))
      .rejects.toThrow(HumanServiceError);

    try {
      await submitHumanResult("exec-999", "human-alice", "output", deps);
    } catch (e) {
      expect((e as HumanServiceError).code).toBe("not_found");
    }
  });

  it("throws forbidden when submitter is not assignee", async () => {
    const deps = makeDeps({
      submitHumanResultRpc: vi.fn().mockResolvedValue({ status: "forbidden" }),
    });

    await expect(submitHumanResult("exec-001", "wrong-user", "output", deps))
      .rejects.toThrow(HumanServiceError);

    try {
      await submitHumanResult("exec-001", "wrong-user", "output", deps);
    } catch (e) {
      expect((e as HumanServiceError).code).toBe("forbidden");
      expect((e as HumanServiceError).message).toContain("not the assigned executor");
    }
  });

  it("throws conflict when execution is not pending", async () => {
    const deps = makeDeps({
      submitHumanResultRpc: vi.fn().mockResolvedValue({
        status: "conflict",
        current_status: "cancelled",
      }),
    });

    await expect(submitHumanResult("exec-001", "human-alice", "output", deps))
      .rejects.toThrow(HumanServiceError);

    try {
      await submitHumanResult("exec-001", "human-alice", "output", deps);
    } catch (e) {
      expect((e as HumanServiceError).code).toBe("conflict");
      expect((e as HumanServiceError).message).toContain("cancelled");
    }
  });

  it("throws conflict when re-submitting with different output", async () => {
    const deps = makeDeps({
      submitHumanResultRpc: vi.fn().mockResolvedValue({ status: "conflict" }),
    });

    await expect(submitHumanResult("exec-001", "human-alice", "different output", deps))
      .rejects.toThrow(HumanServiceError);

    try {
      await submitHumanResult("exec-001", "human-alice", "different output", deps);
    } catch (e) {
      expect((e as HumanServiceError).code).toBe("conflict");
    }
  });

  it("throws conflict when verdict is not human", async () => {
    const deps = makeDeps({
      submitHumanResultRpc: vi.fn().mockResolvedValue({
        status: "invalid_verdict",
        verdict: "ai",
      }),
    });

    await expect(submitHumanResult("exec-001", "human-alice", "output", deps))
      .rejects.toThrow(HumanServiceError);

    try {
      await submitHumanResult("exec-001", "human-alice", "output", deps);
    } catch (e) {
      expect((e as HumanServiceError).code).toBe("conflict");
      expect((e as HumanServiceError).message).toContain("ai");
    }
  });
});

// ── reviewHybridExecution ───────────────────────────────────

describe("reviewHybridExecution", () => {
  it("returns success on approve", async () => {
    const rpcResult: ReviewRpcResult = {
      status: "reviewed",
      execution: { id: "exec-001", task_id: "task-001" },
      task_status: "done",
    };
    const deps = makeDeps({
      reviewHybridExecutionRpc: vi.fn().mockResolvedValue(rpcResult),
    });

    const result = await reviewHybridExecution("exec-001", "reviewer-bob", "approve", null, deps);

    expect(result).toEqual({
      execution_id: "exec-001",
      task_id: "task-001",
      outcome: "approve",
      task_status: "done",
    });
    expect(deps.reviewHybridExecutionRpc).toHaveBeenCalledWith("exec-001", "reviewer-bob", "approve", null);
  });

  it("returns success on reject", async () => {
    const rpcResult: ReviewRpcResult = {
      status: "reviewed",
      execution: { id: "exec-001", task_id: "task-001" },
      task_status: "rejected",
    };
    const deps = makeDeps({
      reviewHybridExecutionRpc: vi.fn().mockResolvedValue(rpcResult),
    });

    const result = await reviewHybridExecution("exec-001", "reviewer-bob", "reject", "Not good enough", deps);

    expect(result).toEqual({
      execution_id: "exec-001",
      task_id: "task-001",
      outcome: "reject",
      task_status: "rejected",
    });
    expect(deps.reviewHybridExecutionRpc).toHaveBeenCalledWith("exec-001", "reviewer-bob", "reject", "Not good enough");
  });

  it("returns success on idempotent re-review (already_reviewed)", async () => {
    const rpcResult: ReviewRpcResult = {
      status: "already_reviewed",
      execution: { id: "exec-001", task_id: "task-001" },
    };
    const deps = makeDeps({
      reviewHybridExecutionRpc: vi.fn().mockResolvedValue(rpcResult),
    });

    const result = await reviewHybridExecution("exec-001", "reviewer-bob", "approve", null, deps);

    expect(result.execution_id).toBe("exec-001");
    expect(result.outcome).toBe("approve");
    expect(result.task_status).toBe("done");
  });

  it("throws not_found when execution does not exist", async () => {
    const deps = makeDeps({
      reviewHybridExecutionRpc: vi.fn().mockResolvedValue({ status: "not_found" }),
    });

    await expect(reviewHybridExecution("exec-999", "reviewer-bob", "approve", null, deps))
      .rejects.toThrow(HumanServiceError);

    try {
      await reviewHybridExecution("exec-999", "reviewer-bob", "approve", null, deps);
    } catch (e) {
      expect((e as HumanServiceError).code).toBe("not_found");
    }
  });

  it("throws forbidden when reviewer is not assigned", async () => {
    const deps = makeDeps({
      reviewHybridExecutionRpc: vi.fn().mockResolvedValue({ status: "forbidden" }),
    });

    await expect(reviewHybridExecution("exec-001", "wrong-reviewer", "approve", null, deps))
      .rejects.toThrow(HumanServiceError);

    try {
      await reviewHybridExecution("exec-001", "wrong-reviewer", "approve", null, deps);
    } catch (e) {
      expect((e as HumanServiceError).code).toBe("forbidden");
      expect((e as HumanServiceError).message).toContain("not the assigned reviewer");
    }
  });

  it("throws conflict on outcome mismatch (reviewed with different outcome)", async () => {
    const deps = makeDeps({
      reviewHybridExecutionRpc: vi.fn().mockResolvedValue({
        status: "conflict",
        reason: "outcome_mismatch",
      }),
    });

    await expect(reviewHybridExecution("exec-001", "reviewer-bob", "reject", null, deps))
      .rejects.toThrow(HumanServiceError);

    try {
      await reviewHybridExecution("exec-001", "reviewer-bob", "reject", null, deps);
    } catch (e) {
      expect((e as HumanServiceError).code).toBe("conflict");
      expect((e as HumanServiceError).message).toContain("different outcome");
    }
  });

  it("throws conflict when execution not succeeded", async () => {
    const deps = makeDeps({
      reviewHybridExecutionRpc: vi.fn().mockResolvedValue({
        status: "conflict",
        reason: "execution_not_succeeded",
        current_status: "running",
      }),
    });

    await expect(reviewHybridExecution("exec-001", "reviewer-bob", "approve", null, deps))
      .rejects.toThrow(HumanServiceError);

    try {
      await reviewHybridExecution("exec-001", "reviewer-bob", "approve", null, deps);
    } catch (e) {
      expect((e as HumanServiceError).code).toBe("conflict");
      expect((e as HumanServiceError).message).toContain("not succeeded");
    }
  });

  it("throws conflict when task not awaiting_approval", async () => {
    const deps = makeDeps({
      reviewHybridExecutionRpc: vi.fn().mockResolvedValue({
        status: "conflict",
        reason: "task_not_awaiting_approval",
        task_status: "done",
      }),
    });

    await expect(reviewHybridExecution("exec-001", "reviewer-bob", "approve", null, deps))
      .rejects.toThrow(HumanServiceError);

    try {
      await reviewHybridExecution("exec-001", "reviewer-bob", "approve", null, deps);
    } catch (e) {
      expect((e as HumanServiceError).code).toBe("conflict");
      expect((e as HumanServiceError).message).toContain("not awaiting approval");
    }
  });

  it("throws conflict when verdict is not hybrid", async () => {
    const deps = makeDeps({
      reviewHybridExecutionRpc: vi.fn().mockResolvedValue({
        status: "invalid_verdict",
        verdict: "ai",
      }),
    });

    await expect(reviewHybridExecution("exec-001", "reviewer-bob", "approve", null, deps))
      .rejects.toThrow(HumanServiceError);

    try {
      await reviewHybridExecution("exec-001", "reviewer-bob", "approve", null, deps);
    } catch (e) {
      expect((e as HumanServiceError).code).toBe("conflict");
      expect((e as HumanServiceError).message).toContain("ai");
    }
  });
});
