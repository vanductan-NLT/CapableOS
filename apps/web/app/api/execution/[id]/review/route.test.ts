import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthenticatedUserId: vi.fn(),
  reviewHybridExecution: vi.fn(),
}));

vi.mock("../../../../../lib/auth", () => ({
  requireAuthenticatedUserId: mocks.requireAuthenticatedUserId,
}));

vi.mock("../../../../../lib/execution/human-service", () => ({
  reviewHybridExecution: mocks.reviewHybridExecution,
  HumanServiceError: class extends Error {
    code: string;
    constructor(code: string, msg: string) { super(msg); this.code = code; this.name = "HumanServiceError"; }
  },
}));

vi.mock("../../../../../lib/supabase/admin", () => ({
  supabaseAdmin: () => ({ rpc: vi.fn() }),
}));

describe("POST /api/execution/[id]/review", () => {
  beforeEach(() => vi.resetAllMocks());

  const execId = "e1000000-0000-0000-0000-000000000001";

  function jsonRequest(body: unknown): Request {
    return new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  it("returns 200 with ReviewResult on approve", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("reviewer-bob");
    mocks.reviewHybridExecution.mockResolvedValue({
      execution_id: execId,
      task_id: "task-001",
      outcome: "approve",
      task_status: "done",
    });

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ outcome: "approve" }), { params: Promise.resolve({ id: execId }) });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.outcome).toBe("approve");
    expect(json.data.task_status).toBe("done");
  });

  it("returns 200 with ReviewResult on reject with note", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("reviewer-bob");
    mocks.reviewHybridExecution.mockResolvedValue({
      execution_id: execId,
      task_id: "task-001",
      outcome: "reject",
      task_status: "rejected",
    });

    const { POST } = await import("./route");
    const res = await POST(
      jsonRequest({ outcome: "reject", note: "Not accurate" }),
      { params: Promise.resolve({ id: execId }) },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.outcome).toBe("reject");
    expect(json.data.task_status).toBe("rejected");
  });

  it("returns 403 when user is not reviewer", async () => {
    const { HumanServiceError } = await import("../../../../../lib/execution/human-service");
    mocks.requireAuthenticatedUserId.mockResolvedValue("wrong-user");
    mocks.reviewHybridExecution.mockRejectedValue(new HumanServiceError("forbidden", "Not reviewer"));

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ outcome: "approve" }), { params: Promise.resolve({ id: execId }) });

    expect(res.status).toBe(403);
  });

  it("returns 409 on outcome mismatch", async () => {
    const { HumanServiceError } = await import("../../../../../lib/execution/human-service");
    mocks.requireAuthenticatedUserId.mockResolvedValue("reviewer-bob");
    mocks.reviewHybridExecution.mockRejectedValue(new HumanServiceError("conflict", "Different outcome"));

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ outcome: "reject" }), { params: Promise.resolve({ id: execId }) });

    expect(res.status).toBe(409);
  });

  it("returns 404 when execution not found", async () => {
    const { HumanServiceError } = await import("../../../../../lib/execution/human-service");
    mocks.requireAuthenticatedUserId.mockResolvedValue("reviewer-bob");
    mocks.reviewHybridExecution.mockRejectedValue(new HumanServiceError("not_found", "Not found"));

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ outcome: "approve" }), { params: Promise.resolve({ id: execId }) });

    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid outcome", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("reviewer-bob");

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ outcome: "maybe" }), { params: Promise.resolve({ id: execId }) });

    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    const { ApiFail } = await import("../../../../../lib/api");
    mocks.requireAuthenticatedUserId.mockRejectedValue(new ApiFail("unauthorized", "Unauthorized"));

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ outcome: "approve" }), { params: Promise.resolve({ id: execId }) });

    expect(res.status).toBe(401);
  });
});
