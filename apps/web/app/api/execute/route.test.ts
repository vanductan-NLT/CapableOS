import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthenticatedUserId: vi.fn(),
  getDecisionById: vi.fn(),
  createExecution: vi.fn(),
  runExecution: vi.fn(),
  createQwenPlannerOptions: vi.fn(),
  mapDecisionToExecution: vi.fn(),
  checkGovernance: vi.fn(),
  resolveGovernanceAction: vi.fn(),
}));

vi.mock("../../../lib/auth", () => ({
  requireAuthenticatedUserId: mocks.requireAuthenticatedUserId,
}));

vi.mock("../../../lib/supabase/admin", () => ({
  supabaseAdmin: () => ({ rpc: vi.fn() }),
}));

vi.mock("../../../lib/execution/execution-repository", () => ({
  createExecutionRepository: () => ({
    getDecisionById: mocks.getDecisionById,
    createExecution: mocks.createExecution,
  }),
  ExecutionRepositoryError: class extends Error {
    code: string;
    constructor(code: string, msg: string) { super(msg); this.code = code; this.name = "ExecutionRepositoryError"; }
  },
}));

vi.mock("../../../lib/execution/executor-service", () => ({
  runExecution: mocks.runExecution,
}));

vi.mock("../../../lib/decision/planner-options", () => ({
  createQwenPlannerOptions: mocks.createQwenPlannerOptions,
}));

vi.mock("../../../lib/execution/mapper", () => ({
  mapDecisionToExecution: mocks.mapDecisionToExecution,
  ExecutionMapperError: class extends Error {
    constructor(msg: string) { super(msg); this.name = "ExecutionMapperError"; }
  },
}));

vi.mock("@orchestra/contracts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@orchestra/contracts")>();
  return {
    ...actual,
    checkGovernance: mocks.checkGovernance,
    resolveGovernanceAction: mocks.resolveGovernanceAction,
  };
});

describe("POST /api/execute", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default governance to allow — existing tests don't care about governance
    mocks.resolveGovernanceAction.mockReturnValue("allow");
    mocks.checkGovernance.mockReturnValue({ gate: "allow", reason: "Action is permitted by default governance policy" });
  });

  const decisionId = "d1000000-0000-0000-0000-000000000001";

  function jsonRequest(body: unknown): Request {
    return new Request("http://localhost/api/execute", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  function makeDecision(verdict: string) {
    return {
      id: decisionId,
      task_id: "t1000000-0000-0000-0000-000000000001",
      verdict,
      chosen: ["ai-summarize"],
      required: [{ cap: "summarization", weight: 1 }],
      risk: "low",
      candidates: [],
      confidence: null,
      ambiguity: null,
      reason: { code: "TOP_CANDIDATE_AI_LOW_RISK", selected_candidate_ids: ["ai-summarize"], ambiguity: null },
      reasoning: "test",
      governance: null,
      cost_est: 0.3,
      minutes_est: 1,
      estimated: true,
      created_at: "2026-01-01T00:00:00Z",
    };
  }

  function makeExecution(overrides = {}) {
    return {
      id: "e1000000-0000-0000-0000-000000000001",
      task_id: "t1000000-0000-0000-0000-000000000001",
      decision_id: decisionId,
      verdict: "ai",
      executor: "summarize",
      assignee_id: "ai-summarize",
      reviewer_id: null,
      status: "pending",
      attempt: 1,
      max_retries: 2,
      root_execution_id: "e1000000-0000-0000-0000-000000000001",
      previous_execution_id: null,
      input: null,
      output: null,
      error_code: null,
      error_message: null,
      tokens: null,
      cost: null,
      ms: null,
      trace_id: "trace-1",
      timeout_at: null,
      started_at: null,
      completed_at: null,
      review_outcome: null,
      review_note: null,
      reviewed_at: null,
      created_at: "2026-01-01T00:00:00Z",
      ...overrides,
    };
  }

  // ── Auth ────────────────────────────────────────────────────

  it("returns 401 when not authenticated", async () => {
    const { ApiFail } = await import("../../../lib/api");
    mocks.requireAuthenticatedUserId.mockRejectedValue(new ApiFail("unauthorized", "Unauthorized"));

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ decision_id: decisionId }), {});

    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid body", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("user-1");

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ decision_id: "not-uuid" }), {});

    expect(res.status).toBe(400);
  });

  // ── Decision not found ──────────────────────────────────────

  it("returns 404 when decision not found", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("user-1");
    mocks.getDecisionById.mockResolvedValue(null);

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ decision_id: decisionId }), {});

    expect(res.status).toBe(404);
  });

  // ── Escalate ────────────────────────────────────────────────

  it("returns 200 with escalate business outcome", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("user-1");
    mocks.getDecisionById.mockResolvedValue(makeDecision("escalate"));

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ decision_id: decisionId }), {});

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.kind).toBe("escalate");
    expect(json.data.execution_id).toBeNull();
    expect(json.data.verdict).toBe("escalate");
    expect(json.data.reason).toContain("manager review");
  });

  // ── Human verdict ───────────────────────────────────────────

  it("returns human_pending for human verdict", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("user-1");
    mocks.getDecisionById.mockResolvedValue(makeDecision("human"));
    mocks.mapDecisionToExecution.mockReturnValue({
      task_id: "t1000000-0000-0000-0000-000000000001",
      decision_id: decisionId,
      verdict: "human",
      executor: null,
      assignee_id: "human-alice",
      reviewer_id: null,
      input: null,
      max_retries: 0,
    });
    mocks.createExecution.mockResolvedValue({
      status: "created",
      execution: makeExecution({ verdict: "human", executor: null, assignee_id: "human-alice" }),
    });

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ decision_id: decisionId }), {});

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.kind).toBe("human_pending");
    expect(json.data.verdict).toBe("human");
    expect(json.data.status).toBe("pending");
    expect(json.data.assignee_id).toBe("human-alice");
    // Must NOT call runExecution for human
    expect(mocks.runExecution).not.toHaveBeenCalled();
  });

  // ── AI success ──────────────────────────────────────────────

  it("returns ai_success when executor succeeds", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("user-1");
    mocks.getDecisionById.mockResolvedValue(makeDecision("ai"));
    mocks.mapDecisionToExecution.mockReturnValue({
      task_id: "t1000000-0000-0000-0000-000000000001",
      decision_id: decisionId,
      verdict: "ai",
      executor: "summarize",
      assignee_id: "ai-summarize",
      reviewer_id: null,
      input: null,
      max_retries: 2,
      timeout_ms: 30000,
    });
    mocks.createExecution.mockResolvedValue({ status: "created", execution: makeExecution() });
    mocks.createQwenPlannerOptions.mockReturnValue({ model: {} });
    mocks.runExecution.mockResolvedValue({
      outcome: "succeeded",
      execution_id: "e1000000-0000-0000-0000-000000000001",
      output: "Summary result",
      tokens: 150,
      ms: 420,
    });

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ decision_id: decisionId }), {});

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.kind).toBe("ai_success");
    expect(json.data.status).toBe("succeeded");
    expect(json.data.output).toBe("Summary result");
    expect(json.data.tokens).toBe(150);
    expect(json.data.ms).toBe(420);
  });

  // ── AI failure with retry ───────────────────────────────────

  it("returns ai_failed with retry_created when retryable", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("user-1");
    mocks.getDecisionById.mockResolvedValue(makeDecision("ai"));
    mocks.mapDecisionToExecution.mockReturnValue({
      task_id: "t1000000-0000-0000-0000-000000000001",
      decision_id: decisionId,
      verdict: "ai",
      executor: "summarize",
      assignee_id: "ai-summarize",
      reviewer_id: null,
      input: null,
      max_retries: 2,
      timeout_ms: 30000,
    });
    mocks.createExecution.mockResolvedValue({ status: "created", execution: makeExecution() });
    mocks.createQwenPlannerOptions.mockReturnValue({ model: {} });
    mocks.runExecution.mockResolvedValue({
      outcome: "failed",
      execution_id: "e1000000-0000-0000-0000-000000000001",
      error_code: "TIMEOUT",
      retryable: true,
      retry_created: true,
    });

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ decision_id: decisionId }), {});

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.kind).toBe("ai_failed");
    expect(json.data.error_code).toBe("TIMEOUT");
    expect(json.data.retryable).toBe(true);
    expect(json.data.retry_created).toBe(true);
  });

  // ── Idempotency: existing execution states ─────────────────

  it("returns existing for active pending execution (no re-run)", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("user-1");
    mocks.getDecisionById.mockResolvedValue(makeDecision("ai"));
    mocks.mapDecisionToExecution.mockReturnValue({});
    mocks.createExecution.mockResolvedValue({
      status: "existing",
      execution: makeExecution({ status: "pending" }),
    });

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ decision_id: decisionId }), {});

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.kind).toBe("existing");
    expect(json.data.status).toBe("pending");
    expect(mocks.runExecution).not.toHaveBeenCalled();
  });

  it("returns existing for active running execution (no re-run)", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("user-1");
    mocks.getDecisionById.mockResolvedValue(makeDecision("ai"));
    mocks.mapDecisionToExecution.mockReturnValue({});
    mocks.createExecution.mockResolvedValue({
      status: "existing",
      execution: makeExecution({ status: "running" }),
    });

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ decision_id: decisionId }), {});

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.kind).toBe("existing");
    expect(json.data.status).toBe("running");
    expect(mocks.runExecution).not.toHaveBeenCalled();
  });

  it("returns existing for terminal succeeded execution (no re-create)", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("user-1");
    mocks.getDecisionById.mockResolvedValue(makeDecision("ai"));
    mocks.mapDecisionToExecution.mockReturnValue({});
    mocks.createExecution.mockResolvedValue({
      status: "existing",
      execution: makeExecution({ status: "succeeded" }),
    });

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ decision_id: decisionId }), {});

    const json = await res.json();
    expect(json.data.kind).toBe("existing");
    expect(json.data.status).toBe("succeeded");
    expect(mocks.runExecution).not.toHaveBeenCalled();
  });

  it("returns existing for terminal failed execution (no re-create)", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("user-1");
    mocks.getDecisionById.mockResolvedValue(makeDecision("ai"));
    mocks.mapDecisionToExecution.mockReturnValue({});
    mocks.createExecution.mockResolvedValue({
      status: "existing",
      execution: makeExecution({ status: "failed" }),
    });

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ decision_id: decisionId }), {});

    const json = await res.json();
    expect(json.data.kind).toBe("existing");
    expect(json.data.status).toBe("failed");
    expect(mocks.runExecution).not.toHaveBeenCalled();
  });

  it("returns existing for terminal cancelled execution (no re-create)", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("user-1");
    mocks.getDecisionById.mockResolvedValue(makeDecision("ai"));
    mocks.mapDecisionToExecution.mockReturnValue({});
    mocks.createExecution.mockResolvedValue({
      status: "existing",
      execution: makeExecution({ status: "cancelled" }),
    });

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ decision_id: decisionId }), {});

    const json = await res.json();
    expect(json.data.kind).toBe("existing");
    expect(json.data.status).toBe("cancelled");
    expect(mocks.runExecution).not.toHaveBeenCalled();
  });

  // ── Task conflict ───────────────────────────────────────────

  it("returns 409 when task is not in routed status", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("user-1");
    mocks.getDecisionById.mockResolvedValue(makeDecision("ai"));
    mocks.mapDecisionToExecution.mockReturnValue({});
    mocks.createExecution.mockResolvedValue({
      status: "conflict",
      task_status: "done",
    });

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ decision_id: decisionId }), {});

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error.code).toBe("conflict");
    expect(json.error.message).toContain("done");
  });

  // ── Hybrid verdict ──────────────────────────────────────────

  it("runs AI executor for hybrid verdict", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("user-1");
    mocks.getDecisionById.mockResolvedValue(makeDecision("hybrid"));
    mocks.mapDecisionToExecution.mockReturnValue({
      task_id: "t1000000-0000-0000-0000-000000000001",
      decision_id: decisionId,
      verdict: "hybrid",
      executor: "summarize",
      assignee_id: "ai-summarize",
      reviewer_id: "human-reviewer",
      input: null,
      max_retries: 2,
      timeout_ms: 30000,
    });
    mocks.createExecution.mockResolvedValue({
      status: "created",
      execution: makeExecution({ verdict: "hybrid", reviewer_id: "human-reviewer" }),
    });
    mocks.createQwenPlannerOptions.mockReturnValue({ model: {} });
    mocks.runExecution.mockResolvedValue({
      outcome: "succeeded",
      execution_id: "e1000000-0000-0000-0000-000000000001",
      output: "AI draft",
      tokens: 200,
      ms: 800,
    });

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ decision_id: decisionId }), {});

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.kind).toBe("ai_success");
    expect(json.data.verdict).toBe("hybrid");
    expect(json.data.output).toBe("AI draft");
    expect(mocks.runExecution).toHaveBeenCalledOnce();
  });

  // ── Upstream error ──────────────────────────────────────────

  it("returns 502 when Qwen provider is unavailable", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("user-1");
    mocks.getDecisionById.mockResolvedValue(makeDecision("ai"));
    mocks.mapDecisionToExecution.mockReturnValue({
      task_id: "t1",
      decision_id: decisionId,
      verdict: "ai",
      executor: "summarize",
      assignee_id: "ai-1",
      reviewer_id: null,
      input: null,
      max_retries: 2,
      timeout_ms: 30000,
    });
    mocks.createExecution.mockResolvedValue({ status: "created", execution: makeExecution() });
    mocks.createQwenPlannerOptions.mockImplementation(() => { throw new Error("Missing env"); });

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ decision_id: decisionId }), {});

    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error.code).toBe("upstream_error");
    expect(json.error.message).not.toContain("Missing env"); // no raw error leak
  });

  // ── Mapper error (no supported capability) ─────────────────

  it("returns 409 when mapper cannot resolve executor", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("user-1");
    mocks.getDecisionById.mockResolvedValue(makeDecision("ai"));
    const { ExecutionMapperError } = await import("../../../lib/execution/mapper");
    mocks.mapDecisionToExecution.mockImplementation(() => { throw new ExecutionMapperError("No supported capability"); });

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ decision_id: decisionId }), {});

    expect(res.status).toBe(409);
  });

  // ── Governance gate (Phase 5) ──────────────────────────────

  it("returns denied (HTTP 200) when governance denies the action", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("user-1");
    mocks.getDecisionById.mockResolvedValue(makeDecision("ai"));
    mocks.mapDecisionToExecution.mockReturnValue({
      task_id: "t1000000-0000-0000-0000-000000000001",
      decision_id: decisionId,
      verdict: "ai",
      executor: "summarize",
      assignee_id: "ai-summarize",
      reviewer_id: null,
      input: null,
      max_retries: 2,
      timeout_ms: 30000,
    });
    mocks.resolveGovernanceAction.mockReturnValue("delete_data");
    mocks.checkGovernance.mockReturnValue({ gate: "deny", reason: 'Action "delete_data" is prohibited by governance policy' });

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ decision_id: decisionId }), {});

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.kind).toBe("denied");
    expect(json.data.execution_id).toBeNull();
    expect(json.data.verdict).toBe("ai");
    expect(json.data.reason).toContain("delete_data");
    // Execution must NOT be created
    expect(mocks.createExecution).not.toHaveBeenCalled();
    expect(mocks.runExecution).not.toHaveBeenCalled();
  });

  it("promotes ai verdict to hybrid when governance requires approval (email executor)", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("user-1");
    mocks.getDecisionById.mockResolvedValue(makeDecision("ai"));
    mocks.mapDecisionToExecution.mockReturnValue({
      task_id: "t1000000-0000-0000-0000-000000000001",
      decision_id: decisionId,
      verdict: "ai",
      executor: "email",
      assignee_id: "ai-email",
      reviewer_id: null,
      input: null,
      max_retries: 2,
      timeout_ms: 30000,
    });
    mocks.resolveGovernanceAction.mockReturnValue("send:email");
    mocks.checkGovernance.mockReturnValue({ gate: "approval", reason: 'Action "send:email" requires human approval before execution' });
    mocks.createExecution.mockResolvedValue({
      status: "created",
      execution: makeExecution({ verdict: "hybrid", executor: "email", assignee_id: "ai-email", reviewer_id: "ai-email" }),
    });
    mocks.createQwenPlannerOptions.mockReturnValue({ model: {} });
    mocks.runExecution.mockResolvedValue({
      outcome: "succeeded",
      execution_id: "e1000000-0000-0000-0000-000000000001",
      output: "Email draft",
      tokens: 180,
      ms: 500,
    });

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ decision_id: decisionId }), {});

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.kind).toBe("ai_success");
    expect(json.data.verdict).toBe("hybrid"); // promoted from ai to hybrid
    expect(json.data.output).toBe("Email draft");
    expect(mocks.runExecution).toHaveBeenCalledOnce();
    // Verify execution was created with hybrid verdict
    expect(mocks.createExecution).toHaveBeenCalledWith(
      "t1000000-0000-0000-0000-000000000001",
      decisionId,
      expect.objectContaining({ verdict: "hybrid", reviewer_id: "ai-email" }),
      expect.any(String),
    );
  });

  it("allows summarize executor through governance gate (regression)", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("user-1");
    mocks.getDecisionById.mockResolvedValue(makeDecision("ai"));
    mocks.mapDecisionToExecution.mockReturnValue({
      task_id: "t1000000-0000-0000-0000-000000000001",
      decision_id: decisionId,
      verdict: "ai",
      executor: "summarize",
      assignee_id: "ai-summarize",
      reviewer_id: null,
      input: null,
      max_retries: 2,
      timeout_ms: 30000,
    });
    mocks.resolveGovernanceAction.mockReturnValue("summarize");
    mocks.checkGovernance.mockReturnValue({ gate: "allow", reason: "Action is permitted by default governance policy" });
    mocks.createExecution.mockResolvedValue({ status: "created", execution: makeExecution() });
    mocks.createQwenPlannerOptions.mockReturnValue({ model: {} });
    mocks.runExecution.mockResolvedValue({
      outcome: "succeeded",
      execution_id: "e1000000-0000-0000-0000-000000000001",
      output: "Summary result",
      tokens: 150,
      ms: 420,
    });

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ decision_id: decisionId }), {});

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.kind).toBe("ai_success");
    expect(json.data.verdict).toBe("ai"); // unchanged, allow gate
    expect(json.data.output).toBe("Summary result");
    expect(mocks.runExecution).toHaveBeenCalledOnce();
  });
});
