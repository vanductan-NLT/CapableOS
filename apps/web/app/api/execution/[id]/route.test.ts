import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthenticatedUserId: vi.fn(),
  getExecutionById: vi.fn(),
  canViewExecution: vi.fn(),
}));

vi.mock("../../../../lib/auth", () => ({
  requireAuthenticatedUserId: mocks.requireAuthenticatedUserId,
}));

vi.mock("../../../../lib/execution/execution-repository", () => ({
  createExecutionRepository: () => ({
    getExecutionById: mocks.getExecutionById,
  }),
  canViewExecution: mocks.canViewExecution,
  ExecutionRepositoryError: class extends Error {
    code: string;
    constructor(code: string, msg: string) { super(msg); this.code = code; }
  },
}));

vi.mock("../../../../lib/supabase/admin", () => ({
  supabaseAdmin: () => ({}),
}));

describe("GET /api/execution/[id]", () => {
  beforeEach(() => vi.resetAllMocks());

  const executionRow = {
    id: "e1000000-0000-0000-0000-000000000001",
    task_id: "t1000000-0000-0000-0000-000000000001",
    decision_id: "d1000000-0000-0000-0000-000000000001",
    verdict: "ai",
    executor: "summarize",
    assignee_id: "user-1",
    reviewer_id: null,
    status: "succeeded",
    attempt: 1,
    max_retries: 2,
    root_execution_id: "e1000000-0000-0000-0000-000000000001",
    previous_execution_id: null,
    input: { task_title: "Test", content: "..." },
    output: "Summary",
    error_code: null,
    error_message: null,
    tokens: 100,
    cost: null,
    ms: 500,
    trace_id: "trace-1",
    timeout_at: null,
    started_at: "2026-01-01T00:00:00Z",
    completed_at: "2026-01-01T00:00:01Z",
    review_outcome: null,
    review_note: null,
    reviewed_at: null,
    created_at: "2026-01-01T00:00:00Z",
  };

  it("returns execution when user is assignee", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("user-1");
    mocks.getExecutionById.mockResolvedValue(executionRow);
    mocks.canViewExecution.mockReturnValue(true);

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost"), { params: Promise.resolve({ id: executionRow.id }) });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.id).toBe(executionRow.id);
    expect(json.data.status).toBe("succeeded");
  });

  it("returns 403 when user is not assignee or reviewer", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("other-user");
    mocks.getExecutionById.mockResolvedValue(executionRow);
    mocks.canViewExecution.mockReturnValue(false);

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost"), { params: Promise.resolve({ id: executionRow.id }) });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("forbidden");
  });

  it("returns 404 when execution not found", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("user-1");
    mocks.getExecutionById.mockResolvedValue(null);

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost"), { params: Promise.resolve({ id: executionRow.id }) });

    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid UUID", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("user-1");

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost"), { params: Promise.resolve({ id: "not-a-uuid" }) });

    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    const { ApiFail } = await import("../../../../lib/api");
    mocks.requireAuthenticatedUserId.mockRejectedValue(new ApiFail("unauthorized", "Unauthorized"));

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost"), { params: Promise.resolve({ id: executionRow.id }) });

    expect(res.status).toBe(401);
  });
});
