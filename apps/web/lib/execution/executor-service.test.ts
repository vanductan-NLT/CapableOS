import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ExecutorServiceDeps, ExecutionRecord, TransitionResult } from "./executor-service";
import { runExecution } from "./executor-service";

// ── Mock @orchestra/ai ──────────────────────────────────────

vi.mock("@orchestra/ai", () => ({
  executeTask: vi.fn(),
}));

import { executeTask } from "@orchestra/ai";
import type { ExecuteResult } from "@orchestra/ai";

const mockExecuteTask = vi.mocked(executeTask);

beforeEach(() => {
  mockExecuteTask.mockReset();
});

// ── Fixtures ────────────────────────────────────────────────

const fakeModel = {} as Parameters<typeof runExecution>[1];

function makeExecution(overrides?: Partial<ExecutionRecord>): ExecutionRecord {
  return {
    id: "exec-001",
    task_id: "task-001",
    decision_id: "decision-001",
    executor: "summarize",
    status: "pending",
    attempt: 1,
    max_retries: 2,
    root_execution_id: "exec-001",
    input: { task_title: "Summarize", content: "Long text..." },
    trace_id: "trace-abc",
    timeout_at: null,
    ...overrides,
  };
}

function makeDeps(overrides?: Partial<ExecutorServiceDeps>): ExecutorServiceDeps {
  return {
    transitionExecution: vi.fn().mockResolvedValue({ status: "transitioned", task_status_update: "none" }),
    createRetryExecution: vi.fn().mockResolvedValue({ id: "exec-retry-001" }),
    log: vi.fn(),
    ...overrides,
  };
}

function successResult(output = "Summary output"): ExecuteResult {
  return {
    ok: true,
    data: { output, tokens: 150, cost: null, ms: 450 },
  };
}

function failureResult(retryable = true): ExecuteResult {
  return {
    ok: false,
    error: {
      error_code: "LLM_ERROR",
      error_message: "AI provider encountered an error",
      retryable,
    },
  };
}

function timeoutResult(): ExecuteResult {
  return {
    ok: false,
    error: {
      error_code: "TIMEOUT",
      error_message: "Execution timed out",
      retryable: true,
    },
  };
}

function validationResult(): ExecuteResult {
  return {
    ok: false,
    error: {
      error_code: "VALIDATION_ERROR",
      error_message: "Executor output validation failed",
      retryable: false,
    },
  };
}

// ── Tests ───────────────────────────────────────────────────

describe("runExecution", () => {
  describe("happy path: pending → running → succeeded", () => {
    it("transitions to running, calls executor, transitions to succeeded", async () => {
      mockExecuteTask.mockResolvedValueOnce(successResult());
      const deps = makeDeps();
      const execution = makeExecution();

      const result = await runExecution(execution, fakeModel, deps);

      expect(result.outcome).toBe("succeeded");
      if (result.outcome === "succeeded") {
        expect(result.execution_id).toBe("exec-001");
        expect(result.output).toBe("Summary output");
        expect(result.tokens).toBe(150);
        expect(result.ms).toBe(450);
      }

      // Verify transitions
      expect(deps.transitionExecution).toHaveBeenCalledTimes(2);
      expect(deps.transitionExecution).toHaveBeenNthCalledWith(1, "exec-001", "start", {});
      expect(deps.transitionExecution).toHaveBeenNthCalledWith(2, "exec-001", "succeed", {
        output: "Summary output",
        tokens: 150,
        cost: undefined,
        ms: 450,
      });
    });

    it("logs execution_start and execution_success events", async () => {
      mockExecuteTask.mockResolvedValueOnce(successResult());
      const deps = makeDeps();

      await runExecution(makeExecution(), fakeModel, deps);

      expect(deps.log).toHaveBeenCalledWith({
        kind: "execution_start",
        execution_id: "exec-001",
        executor: "summarize",
        attempt: 1,
      });
      expect(deps.log).toHaveBeenCalledWith({
        kind: "execution_success",
        execution_id: "exec-001",
        ms: 450,
        tokens: 150,
      });
    });
  });

  describe("failure path: pending → running → failed", () => {
    it("transitions to failed with error details", async () => {
      mockExecuteTask.mockResolvedValueOnce(failureResult(true));
      const deps = makeDeps();

      const result = await runExecution(makeExecution(), fakeModel, deps);

      expect(result.outcome).toBe("failed");
      if (result.outcome === "failed") {
        expect(result.error_code).toBe("LLM_ERROR");
        expect(result.retryable).toBe(true);
        expect(result.retry_created).toBe(true);
      }

      expect(deps.transitionExecution).toHaveBeenNthCalledWith(2, "exec-001", "fail", {
        error_code: "LLM_ERROR",
        error_message: "AI provider encountered an error",
      });
    });

    it("logs execution_failure event", async () => {
      mockExecuteTask.mockResolvedValueOnce(failureResult(true));
      const deps = makeDeps();

      await runExecution(makeExecution(), fakeModel, deps);

      expect(deps.log).toHaveBeenCalledWith({
        kind: "execution_failure",
        execution_id: "exec-001",
        error_code: "LLM_ERROR",
        retryable: true,
      });
    });
  });

  describe("retry row creation", () => {
    it("creates retry row when retryable + attempts remaining", async () => {
      mockExecuteTask.mockResolvedValueOnce(failureResult(true));
      const deps = makeDeps();
      const execution = makeExecution({ attempt: 1, max_retries: 2 });

      const result = await runExecution(execution, fakeModel, deps);

      expect(result.outcome).toBe("failed");
      if (result.outcome === "failed") {
        expect(result.retry_created).toBe(true);
      }

      expect(deps.createRetryExecution).toHaveBeenCalledWith({
        task_id: "task-001",
        decision_id: "decision-001",
        executor: "summarize",
        input: { task_title: "Summarize", content: "Long text..." },
        attempt: 2,
        max_retries: 2,
        root_execution_id: "exec-001",
        previous_execution_id: "exec-001",
        trace_id: "trace-abc",
      });
    });

    it("logs retry_created event", async () => {
      mockExecuteTask.mockResolvedValueOnce(failureResult(true));
      const deps = makeDeps();

      await runExecution(makeExecution({ attempt: 1, max_retries: 2 }), fakeModel, deps);

      expect(deps.log).toHaveBeenCalledWith({
        kind: "retry_created",
        execution_id: "exec-001",
        new_execution_id: "exec-retry-001",
        attempt: 2,
      });
    });

    it("does NOT create retry when max retries exhausted", async () => {
      mockExecuteTask.mockResolvedValueOnce(failureResult(true));
      const deps = makeDeps();
      const execution = makeExecution({ attempt: 2, max_retries: 2 });

      const result = await runExecution(execution, fakeModel, deps);

      expect(result.outcome).toBe("failed");
      if (result.outcome === "failed") {
        expect(result.retry_created).toBe(false);
      }

      expect(deps.createRetryExecution).not.toHaveBeenCalled();
    });

    it("does NOT create retry for non-retryable errors", async () => {
      mockExecuteTask.mockResolvedValueOnce(validationResult());
      const deps = makeDeps();
      const execution = makeExecution({ attempt: 1, max_retries: 2 });

      const result = await runExecution(execution, fakeModel, deps);

      expect(result.outcome).toBe("failed");
      if (result.outcome === "failed") {
        expect(result.retryable).toBe(false);
        expect(result.retry_created).toBe(false);
      }

      expect(deps.createRetryExecution).not.toHaveBeenCalled();
    });
  });

  describe("timeout handling", () => {
    it("handles timeout error and creates retry", async () => {
      mockExecuteTask.mockResolvedValueOnce(timeoutResult());
      const deps = makeDeps();

      const result = await runExecution(makeExecution(), fakeModel, deps);

      expect(result.outcome).toBe("failed");
      if (result.outcome === "failed") {
        expect(result.error_code).toBe("TIMEOUT");
        expect(result.retryable).toBe(true);
        expect(result.retry_created).toBe(true);
      }
    });
  });

  describe("invalid state guards", () => {
    it("returns invalid_state if execution is not pending", async () => {
      const execution = makeExecution({ status: "running" });
      const deps = makeDeps();

      const result = await runExecution(execution, fakeModel, deps);

      expect(result.outcome).toBe("invalid_state");
      if (result.outcome === "invalid_state") {
        expect(result.current_status).toBe("running");
      }

      // Should not call executeTask or transition
      expect(mockExecuteTask).not.toHaveBeenCalled();
      expect(deps.transitionExecution).not.toHaveBeenCalled();
    });

    it("returns invalid_state if start transition fails", async () => {
      const deps = makeDeps({
        transitionExecution: vi.fn().mockResolvedValue({
          status: "invalid_transition",
          current_status: "running",
          event: "start",
        } satisfies TransitionResult),
      });

      const result = await runExecution(makeExecution(), fakeModel, deps);

      expect(result.outcome).toBe("invalid_state");
      expect(mockExecuteTask).not.toHaveBeenCalled();
    });

    it("returns invalid_state if execution not found", async () => {
      const deps = makeDeps({
        transitionExecution: vi.fn().mockResolvedValue({
          status: "not_found",
        } satisfies TransitionResult),
      });

      const result = await runExecution(makeExecution(), fakeModel, deps);

      expect(result.outcome).toBe("invalid_state");
      if (result.outcome === "invalid_state") {
        expect(result.current_status).toBe("not_found");
      }
    });
  });

  describe("tokens handling", () => {
    it("passes null tokens to succeed transition when provider returns null", async () => {
      mockExecuteTask.mockResolvedValueOnce({
        ok: true,
        data: { output: "Result", tokens: null, cost: null, ms: 200 },
      });
      const deps = makeDeps();

      const result = await runExecution(makeExecution(), fakeModel, deps);

      expect(result.outcome).toBe("succeeded");
      if (result.outcome === "succeeded") {
        expect(result.tokens).toBeNull();
      }

      expect(deps.transitionExecution).toHaveBeenNthCalledWith(2, "exec-001", "succeed", {
        output: "Result",
        tokens: undefined,
        cost: undefined,
        ms: 200,
      });
    });
  });
});
